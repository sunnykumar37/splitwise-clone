from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from common.utils import quantize_money
from groups.models import Group

from .models import Expense, ExpenseParticipant

User = get_user_model()


class ExpenseParticipantInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    percentage = serializers.DecimalField(max_digits=8, decimal_places=4, required=False)
    shares = serializers.DecimalField(max_digits=12, decimal_places=4, required=False)

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")
        return value


class ExpenseParticipantSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseParticipant
        fields = ["id", "user", "amount_owed", "percentage", "shares"]

    def get_user(self, obj):
        return {"id": obj.user_id, "username": obj.user.username, "email": obj.user.email}


class ExpenseReadSerializer(serializers.ModelSerializer):
    participants = ExpenseParticipantSerializer(many=True, read_only=True)
    group = serializers.SerializerMethodField()
    paid_by = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    split_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ["id", "group", "description", "amount", "paid_by", "split_type", "created_by", "created_at", "participants", "split_breakdown"]

    def get_group(self, obj):
        return {"id": obj.group_id, "name": obj.group.name}

    def get_paid_by(self, obj):
        return {"id": obj.paid_by_id, "username": obj.paid_by.username, "email": obj.paid_by.email}

    def get_created_by(self, obj):
        return {"id": obj.created_by_id, "username": obj.created_by.username, "email": obj.created_by.email}

    def get_split_breakdown(self, obj):
        return [
            {
                "user": participant.user_id,
                "amount_owed": str(participant.amount_owed),
                "percentage": str(participant.percentage) if participant.percentage is not None else None,
                "shares": str(participant.shares) if participant.shares is not None else None,
            }
            for participant in obj.participants.all()
        ]


class ExpenseCreateSerializer(serializers.Serializer):
    description = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_by = serializers.IntegerField()
    split_type = serializers.ChoiceField(choices=Expense.SplitType.choices)
    participants = ExpenseParticipantInputSerializer(many=True)

    def validate_group_id(self, value):
        if not Group.objects.filter(id=value).exists():
            raise serializers.ValidationError("Group does not exist")
        return value

    def validate_paid_by(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Payer does not exist")
        return value

    def validate(self, attrs):
        amount = Decimal(attrs["amount"])
        split_type = attrs["split_type"]
        participants = attrs["participants"]
        participant_ids = [participant["user_id"] for participant in participants]

        if not participants:
            raise serializers.ValidationError({"participants": "At least one participant is required"})

        if len(participant_ids) != len(set(participant_ids)):
            raise serializers.ValidationError({"participants": "Each participant must appear only once"})

        if split_type == Expense.SplitType.UNEQUAL:
            if any("amount" not in participant for participant in participants):
                raise serializers.ValidationError({"participants": "Unequal splits require amount for each participant"})
            total = sum((Decimal(participant.get("amount", 0)) for participant in participants), Decimal("0.00"))
            if quantize_money(total) != quantize_money(amount):
                raise serializers.ValidationError({"participants": "Unequal splits must total the expense amount"})

        if split_type == Expense.SplitType.PERCENTAGE:
            if any("percentage" not in participant for participant in participants):
                raise serializers.ValidationError({"participants": "Percentage splits require percentage for each participant"})
            total_percentage = sum((Decimal(participant.get("percentage", 0)) for participant in participants), Decimal("0.00"))
            if quantize_money(total_percentage) != Decimal("100.00"):
                raise serializers.ValidationError({"participants": "Percentage splits must total 100%"})

        if split_type == Expense.SplitType.SHARES:
            if any("shares" not in participant for participant in participants):
                raise serializers.ValidationError({"participants": "Share splits require shares for each participant"})
            total_shares = sum(Decimal(str(participant.get("shares", 0))) for participant in participants)
            if total_shares <= 0:
                raise serializers.ValidationError({"participants": "Share splits must include at least one positive share"})

        return attrs


class ExpenseDetailSerializer(ExpenseReadSerializer):
    pass