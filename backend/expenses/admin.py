from django.contrib import admin

from .models import Expense, ExpenseParticipant


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "group", "description", "amount", "paid_by", "split_type", "created_at")
    list_filter = ("split_type",)


@admin.register(ExpenseParticipant)
class ExpenseParticipantAdmin(admin.ModelAdmin):
    list_display = ("id", "expense", "user", "amount_owed", "percentage", "shares")