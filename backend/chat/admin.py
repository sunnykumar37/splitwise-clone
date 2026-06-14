from django.contrib import admin

from .models import ExpenseMessage


@admin.register(ExpenseMessage)
class ExpenseMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "expense", "sender", "created_at")