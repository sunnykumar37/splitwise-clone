from django.urls import path

from .views import ExpenseMessageListAPIView

urlpatterns = [
    path("", ExpenseMessageListAPIView.as_view(), name="expense-messages"),
]