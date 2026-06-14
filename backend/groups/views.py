from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from common.responses import success_response
from common.services import BalanceService

from .permissions import IsAuthenticatedGroupEndpoint, IsGroupCreatorPermission, IsGroupMemberPermission
from .models import Group
from .serializers import GroupCreateSerializer, GroupMemberAddSerializer, GroupMemberRemoveSerializer, GroupMemberSerializer, GroupSerializer, GroupUpdateSerializer
from .services import GroupService

User = get_user_model()


class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAuthenticatedGroupEndpoint]

    def get_queryset(self):
        return Group.objects.filter(members__user=self.request.user).distinct().select_related("created_by").prefetch_related("members__user")

    def get_serializer_class(self):
        if self.action == "create":
            return GroupCreateSerializer
        if self.action in {"update", "partial_update"}:
            return GroupUpdateSerializer
        return GroupSerializer

    def get_object(self):
        obj = super().get_object()
        if self.action in {"retrieve", "balance_summary", "balances"}:
            self.check_object_permissions(self.request, obj)
            if not IsGroupMemberPermission().has_object_permission(self.request, self, obj):
                self.permission_denied(self.request, message=IsGroupMemberPermission.message)
        elif self.action in {"update", "partial_update", "destroy", "add_member", "remove_member"}:
            self.check_object_permissions(self.request, obj)
            if not IsGroupCreatorPermission().has_object_permission(self.request, self, obj):
                self.permission_denied(self.request, message=IsGroupCreatorPermission.message)
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = GroupService.create_group(
            creator=request.user,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
        )
        return success_response(GroupSerializer(group, context=self.get_serializer_context()).data, "Group created", 201)

    def list(self, request, *args, **kwargs):
        groups = self.get_queryset()
        serializer = GroupSerializer(groups, many=True, context=self.get_serializer_context())
        return success_response(serializer.data, "Groups fetched")

    def retrieve(self, request, *args, **kwargs):
        group = self.get_object()
        serializer = GroupSerializer(group, context=self.get_serializer_context())
        return success_response(serializer.data, "Group fetched")

    def update(self, request, *args, **kwargs):
        group = self.get_object()
        serializer = self.get_serializer(group, data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(GroupSerializer(group, context=self.get_serializer_context()).data, "Group updated")

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        group.delete()
        return success_response(message="Group deleted")

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsGroupCreatorPermission], url_path="add-member")
    def add_member(self, request, pk=None):
        group = self.get_object()
        serializer = GroupMemberAddSerializer(data=request.data, group=group)
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(User, id=serializer.validated_data["user_id"])
        membership = GroupService.add_member(group=group, user=user, role=serializer.validated_data.get("role"))
        return success_response(GroupMemberSerializer(membership).data, "Member added", 201)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsGroupCreatorPermission], url_path="remove-member")
    def remove_member(self, request, pk=None):
        group = self.get_object()
        serializer = GroupMemberRemoveSerializer(data=request.data, group=group)
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(User, id=serializer.validated_data["user_id"])
        GroupService.remove_member(group=group, user=user)
        return success_response(message="Member removed")

    @action(detail=True, methods=["get"])
    def balance_summary(self, request, pk=None):
        group = self.get_object()
        return success_response(BalanceService.get_group_summary(group), "Group balance summary")

    @action(detail=True, methods=["get"], url_path="balances")
    def balances(self, request, pk=None):
        group = self.get_object()
        summary = BalanceService.calculate_group_balances(group, request.user)
        return success_response(summary, "Group balance summary")