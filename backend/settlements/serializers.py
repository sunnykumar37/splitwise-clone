from django.contrib.auth import get_user_model
from rest_framework import serializers
from decimal import Decimal

from groups.models import Group

from .models import Settlement

User = get_user_model()


class SettlementSerializer(serializers.ModelSerializer):
    payer = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    balance_impact = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = ["id", "group", "payer", "receiver", "amount", "created_by", "created_at", "balance_impact"]

    def get_group(self, obj):
        return {"id": obj.group_id, "name": obj.group.name}

    def get_payer(self, obj):
        return {"id": obj.paid_by_id, "username": obj.paid_by.username, "email": obj.paid_by.email}

    def get_receiver(self, obj):
        return {"id": obj.paid_to_id, "username": obj.paid_to.username, "email": obj.paid_to.email}

    def get_balance_impact(self, obj):
        return {
            "payer": {"user_id": obj.paid_by_id, "delta": str(-obj.amount)},
            "receiver": {"user_id": obj.paid_to_id, "delta": str(obj.amount)},
        }


class SettlementCreateSerializer(serializers.Serializer):
    payer = serializers.IntegerField()
    receiver = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def __init__(self, *args, **kwargs):
        self.group = kwargs.pop("group", None)
        super().__init__(*args, **kwargs)

    def validate_payer(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Payer does not exist")
        return value

    def validate_receiver(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Receiver does not exist")
        return value

    def validate(self, attrs):
        if Decimal(attrs["amount"]) <= Decimal("0.00"):
            raise serializers.ValidationError({"amount": "Settlement amount must be greater than zero"})

        if attrs["payer"] == attrs["receiver"]:
            raise serializers.ValidationError({"receiver": "Payer and receiver must be different users"})

        if self.group is not None:
            group_member_ids = set(Group.objects.filter(id=self.group.id).values_list("members__user_id", flat=True))
            if attrs["payer"] not in group_member_ids or attrs["receiver"] not in group_member_ids:
                raise serializers.ValidationError({"group": "Payer and receiver must belong to the same group"})

        return attrs


class SettlementDetailSerializer(SettlementSerializer):
    note = serializers.CharField(read_only=True)

    class Meta(SettlementSerializer.Meta):
        fields = SettlementSerializer.Meta.fields + ["note"]