import os
from flask import Flask
from flask_cors import CORS
from src.config import Config
from src.routes.views import views_bp
from src.routes.api_routes import api_bp


def create_app(config_class=Config):
    """Application factory for Virtual Lab Flask server."""
    # Note: templates and static folders relative to root or src
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    template_dir = os.path.join(base_dir, "templates")
    static_dir = os.path.join(base_dir, "src", "static")

    app = Flask(
        __name__,
        template_folder=template_dir,
        static_folder=static_dir,
        static_url_path="/static"
    )
    app.config.from_object(config_class)

    # Enable CORS for development & API consumption
    CORS(app)

    # Register Blueprints
    app.register_blueprint(views_bp)
    app.register_blueprint(api_bp)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
