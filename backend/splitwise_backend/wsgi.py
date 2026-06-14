"""WSGI config for Splitwise backend."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "splitwise_backend.settings")

application = get_wsgi_application()