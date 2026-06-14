from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from common.responses import success_response
from common.responses import error_response
from groups.models import Group
from groups.models import GroupMember

from .models import Expense
from .permissions import IsExpenseCreator, IsExpenseGroupMember
from .serializers import ExpenseCreateSerializer, ExpenseDetailSerializer, ExpenseReadSerializer
from .services import ExpenseService

User = get_user_model()


class ExpenseViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsExpenseGroupMember]

    def get_queryset(self):
        queryset = Expense.objects.filter(group__members__user=self.request.user).select_related("group", "paid_by", "created_by").prefetch_related("participants__user")
        group_id = self.kwargs.get("group_id") or self.request.query_params.get("group_id")
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ExpenseCreateSerializer
        if self.action == "retrieve":
            return ExpenseDetailSerializer
        return ExpenseReadSerializer

    def _get_group(self):
        group_id = self.kwargs.get("group_id") or self.request.data.get("group_id") or self.request.query_params.get("group_id")
        if group_id is None:
            return None
        return get_object_or_404(Group, id=group_id, members__user=self.request.user)

    def _serialize_participants(self, group, participants):
        participant_users = []
        for item in participants:
            participant_users.append(get_object_or_404(User, id=item["user_id"], group_memberships__group=group))

        payload = []
        for index, participant in enumerate(participants):
            payload.append({"user": participant_users[index], **participant})
        return payload

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(serializer.data, "Expenses fetched")

    def retrieve(self, request, *args, **kwargs):
        expense_id = kwargs.get("expense_id") or kwargs.get("pk")
        expense = get_object_or_404(self.get_queryset(), pk=expense_id)
        serializer = self.get_serializer(expense)
        return success_response(serializer.data, "Expense fetched")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        group = self._get_group()
        if group is None:
            return error_response(message="group_id is required in the nested group route", status_code=400)
        paid_by = get_object_or_404(User, id=validated["paid_by"], group_memberships__group=group)
        participant_payload = self._serialize_participants(group, validated["participants"])
        expense = ExpenseService.create_expense(
            creator=request.user,
            group=group,
            description=validated["description"],
            amount=validated["amount"],
            paid_by=paid_by,
            split_type=validated["split_type"],
            participants=participant_payload,
        )
        return success_response(ExpenseDetailSerializer(expense).data, "Expense created", 201)

    def destroy(self, request, *args, **kwargs):
        expense_id = kwargs.get("expense_id") or kwargs.get("pk")
        expense = get_object_or_404(self.get_queryset(), pk=expense_id)
        self.check_object_permissions(request, expense)
        if not IsExpenseCreator().has_object_permission(request, self, expense):
            self.permission_denied(request, message=IsExpenseCreator.message)
        expense.delete()
        return success_response(message="Expense deleted")