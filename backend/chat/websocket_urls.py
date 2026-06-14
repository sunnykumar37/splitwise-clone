from django.urls import re_path

from .consumers import ExpenseChatConsumer
from .middleware import JWTAuthMiddleware

websocket_urlpatterns = [
    re_path(r"ws/expenses/(?P<expense_id>\d+)/$", JWTAuthMiddleware(ExpenseChatConsumer.as_asgi())),
]