from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner
        self.auth = JWTAuthentication()

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        scope["user"] = AnonymousUser()
        token = self._get_token(scope)
        if token:
            try:
                validated = self.auth.get_validated_token(token)
                scope["user"] = await self.get_user(validated)
            except (InvalidToken, TokenError):
                scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)

    def _get_token(self, scope):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        if token:
            return token

        for header, value in scope.get("headers", []):
            if header == b"authorization":
                auth_value = value.decode()
                if auth_value.lower().startswith("bearer "):
                    return auth_value.split(" ", 1)[1]
        return None

    @database_sync_to_async
    def get_user(self, validated_token):
        return self.auth.get_user(validated_token)