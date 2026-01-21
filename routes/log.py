from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Log, User
from datetime import datetime, timedelta

from routes.user import admin_required

def make_log(
    user_id: int,
    access_granted: bool,
    error_log: str | None = None
):
    """
    Create and persist an access log entry.
    """
    log = Log(
        user_id=user_id,
        access_granted=access_granted,
        error_log=error_log,
    )

    db.session.add(log)
    db.session.commit()

    return log

log_ns = Namespace('logs', description='Access log operations')

# Models for Swagger documentation
log_model = log_ns.model('Log', {
    'id': fields.Integer(description='Log ID', readonly=True),
    'user_id': fields.Integer(description='User ID'),
    'access_granted': fields.Boolean(description='Whether access was granted'),
    'error_log': fields.String(description='Error message if access denied'),
    'time': fields.String(description='Timestamp of access attempt'),
})

log_stats_model = log_ns.model('LogStats', {
    'total_attempts': fields.Integer(
        description='Total number of access attempts in the given period',
        example=120
    ),
    'successful_attempts': fields.Integer(
        description='Number of successful access attempts',
        example=90
    ),
    'failed_attempts': fields.Integer(
        description='Number of failed access attempts',
        example=30
    ),
    'success_rate': fields.Float(
        description='Success rate percentage',
        example=75.0
    ),
    'unique_users': fields.Integer(
        description='Number of unique users who attempted access',
        example=15
    ),
    'biometric_attempts': fields.Integer(
        description='Number of biometric-based access attempts',
        example=40
    ),
    'recent_activity': fields.List(
        fields.Nested(log_model),
        description='Most recent access log entries'
    )
})

log_list_model = log_ns.model('LogList', {
    'logs': fields.List(fields.Nested(log_model)),
    'total': fields.Integer(description='Total number of logs'),
    'page': fields.Integer(description='Current page number'),
    'pages': fields.Integer(description='Total number of pages')
})

user_log_list_model = log_ns.model('UserLogList', {
    'logs': fields.List(fields.Nested(log_model)),
    'total': fields.Integer(description='Total number of logs'),
    'page': fields.Integer(description='Current page number'),
    'pages': fields.Integer(description='Total number of pages'),
    'user_email': fields.String(description='User email')
})

error_model = log_ns.model('Error', {
    'error': fields.String(description='Error message')
})


@log_ns.route('/')
class LogList(Resource):
    @log_ns.doc('get_logs',
                description='Get access logs. Admins see all logs, regular users see only their own.',
                security='Bearer',
                params={
                    'page': {'description': 'Page number', 'type': 'integer', 'default': 1},
                    'per_page': {'description': 'Items per page', 'type': 'integer', 'default': 50},
                    'user_id': {'description': 'Filter by user ID (admin only)', 'type': 'integer'},
                    'access_granted': {'description': 'Filter by access status (true/false)', 'type': 'boolean'},
                    'start_date': {'description': 'Start date filter (ISO format)', 'type': 'string',
                                   'example': '2025-01-01T00:00:00'},
                    'end_date': {'description': 'End date filter (ISO format)', 'type': 'string',
                                 'example': '2025-12-31T23:59:59'}
                })
    @log_ns.response(200, 'Success', log_list_model)
    @log_ns.response(400, 'Invalid date format', error_model)
    @log_ns.response(401, 'Unauthorized', error_model)
    @admin_required()
    def get(self):
        """Get access logs with optional filters (admin-only full access)"""

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = Log.query

        # Admin can filter by user_id
        if request.args.get('user_id'):
            query = query.filter_by(user_id=request.args.get('user_id', type=int))

        # Start date filter
        if request.args.get('start_date'):
            try:
                start_date = datetime.fromisoformat(request.args.get('start_date'))
                query = query.filter(Log.time >= start_date)
            except ValueError:
                return {'error': 'Invalid start_date format'}, 400

        # End date filter
        if request.args.get('end_date'):
            try:
                end_date = datetime.fromisoformat(request.args.get('end_date'))
                query = query.filter(Log.time <= end_date)
            except ValueError:
                return {'error': 'Invalid end_date format'}, 400

        query = query.order_by(Log.created_at.desc())
        logs = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'page': logs.page,
            'pages': logs.pages
        }, 200

@log_ns.route('/stats')
class LogStats(Resource):
    @log_ns.doc('get_log_stats',
                description='Get access log statistics including success/fail rates, unique users, etc. (admin only)',
                security='Bearer',
                params={
                    'days': {'description': 'Number of days to include in stats', 'type': 'integer', 'default': 7}
                })
    @log_ns.response(200, 'Success', log_stats_model)
    @log_ns.response(401, 'Unauthorized', error_model)
    @log_ns.response(403, 'Admin privileges required', error_model)
    @jwt_required()
    def get(self):
        """Get log statistics (admin only)"""
        claims = get_jwt()
        if not claims.get('is_admin', False):
            return {'error': 'Admin privileges required'}, 403

        days = request.args.get('days', 7, type=int)
        time_threshold = datetime.utcnow() - timedelta(days=days)

        total_attempts = Log.query.filter(Log.time >= time_threshold).count()
        successful_attempts = Log.query.filter(
            Log.time >= time_threshold,
            Log.access_granted == True
        ).count()
        failed_attempts = Log.query.filter(
            Log.time >= time_threshold,
            Log.access_granted == False
        ).count()

        success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0

        unique_users = db.session.query(Log.user_id).filter(
            Log.time >= time_threshold
        ).distinct().count()

        biometric_attempts = Log.query.filter(
            Log.time >= time_threshold,
            Log.biometric_hash.isnot(None)
        ).count()

        recent_logs = Log.query.order_by(Log.time.desc()).limit(10).all()

        return {
            'total_attempts': total_attempts,
            'successful_attempts': successful_attempts,
            'failed_attempts': failed_attempts,
            'success_rate': round(success_rate, 2),
            'unique_users': unique_users,
            'biometric_attempts': biometric_attempts,
            'recent_activity': [log.to_dict() for log in recent_logs]
        }, 200