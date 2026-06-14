from django.db import transaction

from common.utils import quantize_money
from groups.models import Group

from .models import Settlement


class SettlementService:
    @staticmethod
    @transaction.atomic
    def create_settlement(*, creator, group: Group, payer, receiver, amount, note=""):
        return Settlement.objects.create(
            group=group,
            paid_by=payer,
            paid_to=receiver,
            amount=quantize_money(amount),
            note=note,
            created_by=creator,
        )

    @staticmethod
    def settlement_balance_impact(settlement):
        return {
            "payer": {"user_id": settlement.paid_by_id, "delta": -settlement.amount},
            "receiver": {"user_id": settlement.paid_to_id, "delta": settlement.amount},
        }