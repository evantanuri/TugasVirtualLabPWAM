import os

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "virtual-lab-tpb-itb-secret-2026")
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    PORT = int(os.environ.get("PORT", 5000))
