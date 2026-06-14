from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets

from common.responses import error_response
from common.responses import success_response
from groups.models import Group
from groups.models import GroupMember

from .models import Settlement
from .serializers import SettlementCreateSerializer, SettlementDetailSerializer, SettlementSerializer
from .services import SettlementService

User = get_user_model()


class SettlementViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Settlement.objects.filter(group__members__user=self.request.user).select_related("group", "paid_by", "paid_to", "created_by")
        group_id = self.kwargs.get("group_id") or self.request.query_params.get("group_id")
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return SettlementCreateSerializer
        if self.action == "retrieve":
            return SettlementDetailSerializer
        return SettlementSerializer

    def _get_group(self):
        group_id = self.kwargs.get("group_id") or self.request.data.get("group_id") or self.request.query_params.get("group_id")
        if group_id is None:
            return None
        return get_object_or_404(Group, id=group_id)

    def _ensure_group_member(self, group, user_id):
        return GroupMember.objects.filter(group=group, user_id=user_id).exists()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(serializer.data, "Settlements fetched")

    def create(self, request, *args, **kwargs):
        group = self._get_group()
        if group is None:
            return error_response(message="group_id is required in the nested group route", status_code=400)

        if not GroupMember.objects.filter(group=group, user=request.user).exists():
            return success_response(message="You must be a group member to create settlements", status_code=403)

        serializer = self.get_serializer(data=request.data, group=group)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        paid_by = get_object_or_404(User, id=validated["payer"], group_memberships__group=group)
        paid_to = get_object_or_404(User, id=validated["receiver"], group_memberships__group=group)
        settlement = SettlementService.create_settlement(
            creator=request.user,
            group=group,
            payer=paid_by,
            receiver=paid_to,
            amount=validated["amount"],
        )
        return success_response(SettlementSerializer(settlement).data, "Settlement recorded", 201)

    def retrieve(self, request, *args, **kwargs):
        settlement_id = kwargs.get("settlement_id") or kwargs.get("pk")
        settlement = get_object_or_404(self.get_queryset(), pk=settlement_id)
        serializer = self.get_serializer(settlement)
        return success_response(serializer.data, "Settlement fetched")