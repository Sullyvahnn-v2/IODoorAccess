from __init__ import create_app
from config import DevelopmentConfig, ProductionConfig
import os

# Choose config based on environment
config = ProductionConfig if os.environ.get('FLASK_ENV') == 'production' else DevelopmentConfig
# config = DevelopmentConfig

app = create_app(config)

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=config.DEBUG
    )