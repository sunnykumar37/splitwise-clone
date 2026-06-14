from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Group, GroupMember


class IsAuthenticatedGroupEndpoint(BasePermission):
	message = "Authentication is required."

	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated)


class IsGroupMemberPermission(BasePermission):
	message = "You must be a member of this group to access it."

	def has_object_permission(self, request, view, obj):
		if isinstance(obj, Group):
			return GroupMember.objects.filter(group=obj, user=request.user).exists()
		return False


class IsGroupCreatorPermission(BasePermission):
	message = "Only the group creator can perform this action."

	def has_object_permission(self, request, view, obj):
		if request.method in SAFE_METHODS:
			return True
		if isinstance(obj, Group):
			return obj.created_by_id == request.user.id
		return False
