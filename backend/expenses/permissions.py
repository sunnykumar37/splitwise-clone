from rest_framework.permissions import BasePermission, SAFE_METHODS

from expenses.models import Expense
from groups.models import GroupMember


class IsExpenseGroupMember(BasePermission):
    message = "You must be a group member to access this expense."

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Expense):
            return GroupMember.objects.filter(group=obj.group, user=request.user).exists()
        return False


class IsExpenseCreator(BasePermission):
    message = "Only the expense creator can delete this expense."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if isinstance(obj, Expense):
            return obj.created_by_id == request.user.id
        return False