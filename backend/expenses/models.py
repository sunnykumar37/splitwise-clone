from django.conf import settings
from django.db import models

from groups.models import Group


class Expense(models.Model):
    class SplitType(models.TextChoices):
        EQUAL = "EQUAL", "Equal"
        UNEQUAL = "UNEQUAL", "Unequal"
        PERCENTAGE = "PERCENTAGE", "Percentage"
        SHARES = "SHARES", "Shares"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="expenses")
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="paid_expenses")
    split_type = models.CharField(max_length=20, choices=SplitType.choices)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_expenses")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.description} - {self.amount}"


class ExpenseParticipant(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expense_participations")
    amount_owed = models.DecimalField(max_digits=12, decimal_places=2)
    percentage = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    shares = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)

    class Meta:
        unique_together = ("expense", "user")
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.user} owes {self.amount_owed}"