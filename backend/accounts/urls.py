from django.urls import path

from .views import CurrentUserAPIView, LoginAPIView, RefreshTokenAPIView, RegisterAPIView

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("refresh/", RefreshTokenAPIView.as_view(), name="token_refresh"),
    path("me/", CurrentUserAPIView.as_view(), name="me"),
]