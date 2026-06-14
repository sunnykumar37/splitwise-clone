from django.conf import settings
from django.db import models

from expenses.models import Expense


class ExpenseMessage(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expense_messages")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.sender}: {self.content[:20]}"