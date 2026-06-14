from rest_framework import generics, permissions, status
from rest_framework_simplejwt.views import TokenRefreshView

from common.responses import success_response

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login_serializer = LoginSerializer(data={"login": user.username, "password": request.data["password"]})
        login_serializer.is_valid(raise_exception=True)
        payload = {"user": UserSerializer(user).data, **login_serializer.validated_data}
        return success_response(payload, "User registered successfully", status.HTTP_201_CREATED)


class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.validated_data, "Login successful")


class CurrentUserAPIView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class RefreshTokenAPIView(TokenRefreshView):
    pass