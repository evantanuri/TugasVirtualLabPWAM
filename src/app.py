"""
Flask Application Factory & Local Server Runner.
Virtual Lab Fisika TPB ITB - Simulasi Kinematika Parabola & Tembakan Meriam.
"""

import sys
import os

# Ensure repository root is on sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask
from flask_cors import CORS
from src.config import Config
from src.routes.views import views_bp
from src.routes.api_routes import api_bp


def create_app(config_class=Config):
    """Application factory for Virtual Lab Flask server."""
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

    # Enable CORS for cross-origin API requests during development/deployment
    CORS(app)

    # Register application blueprints
    app.register_blueprint(views_bp)
    app.register_blueprint(api_bp)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
