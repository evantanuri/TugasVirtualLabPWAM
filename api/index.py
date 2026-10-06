"""
Vercel Serverless WSGI Entrypoint.
Exposes the Flask 'app' instance to the @vercel/python builder.
"""

import os
import sys

# Ensure root directory is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from src.app import app

# Vercel WSGI entrypoint expects 'app' or handler
handler = app
