from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response

from common.permissions import IsExpenseParticipant
from expenses.models import Expense

from .models import ExpenseMessage
from .serializers import ExpenseMessageSerializer


class ExpenseMessageListAPIView(generics.ListAPIView):
    serializer_class = ExpenseMessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsExpenseParticipant]

    def get_queryset(self):
        expense = get_object_or_404(Expense, id=self.kwargs["expense_id"])
        self.check_object_permissions(self.request, expense)
        return ExpenseMessage.objects.filter(expense=expense).select_related("sender")

    def list(self, request, *args, **kwargs):
        messages = self.get_queryset()
        serializer = self.get_serializer(messages, many=True)
        return Response({"messages": serializer.data})