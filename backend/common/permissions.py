from rest_framework.permissions import BasePermission, SAFE_METHODS

from groups.models import GroupMember
from expenses.models import ExpenseParticipant


class IsGroupMember(BasePermission):
    message = "You are not a member of this group."

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "members"):
            return obj.members.filter(user=request.user).exists()
        return False


class IsGroupAdmin(BasePermission):
    message = "You do not have permission to manage this group."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return GroupMember.objects.filter(group=obj, user=request.user, role=GroupMember.Role.ADMIN).exists()


class IsExpenseParticipant(BasePermission):
    message = "You are not allowed to access this expense chat."

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "participants"):
            return obj.participants.filter(user=request.user).exists()
        return ExpenseParticipant.objects.filter(expense=obj, user=request.user).exists()