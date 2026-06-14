from decimal import Decimal

from django.db.models import Prefetch

from expenses.models import ExpenseParticipant
from settlements.models import Settlement


class BalanceService:
    @staticmethod
    def _group_member_balances(group):
        balances = {}
        members = list(group.members.select_related("user").all())
        for member in members:
            balances[member.user_id] = Decimal("0.00")

        expenses = (
            group.expenses.select_related("paid_by", "created_by")
            .prefetch_related(Prefetch("participants", queryset=ExpenseParticipant.objects.select_related("user")))
            .all()
        )

        for expense in expenses:
            balances[expense.paid_by_id] = balances.get(expense.paid_by_id, Decimal("0.00")) + expense.amount
            for participant in expense.participants.all():
                balances[participant.user_id] = balances.get(participant.user_id, Decimal("0.00")) - participant.amount_owed

        settlements = (
            group.settlements.select_related("paid_by", "paid_to")
            .all()
        )

        for settlement in settlements:
            balances[settlement.paid_by_id] = balances.get(settlement.paid_by_id, Decimal("0.00")) - settlement.amount
            balances[settlement.paid_to_id] = balances.get(settlement.paid_to_id, Decimal("0.00")) + settlement.amount

        return members, balances, expenses

    @staticmethod
    def calculate_group_balances(group, user):
        members, balances, _expenses = BalanceService._group_member_balances(group)
        user_balance = balances.get(user.id, Decimal("0.00"))

        you_owe = abs(user_balance) if user_balance < 0 else Decimal("0.00")
        you_are_owed = user_balance if user_balance > 0 else Decimal("0.00")

        member_balances = []
        for member in members:
            if member.user_id == user.id:
                continue
            member_balance = balances.get(member.user_id, Decimal("0.00"))
            member_balances.append(
                {
                    "user_id": member.user_id,
                    "username": member.user.username,
                    "balance": member_balance,
                }
            )

        return {
            "you_owe": you_owe.quantize(Decimal("0.01")),
            "you_are_owed": you_are_owed.quantize(Decimal("0.01")),
            "net_balance": user_balance.quantize(Decimal("0.01")),
            "member_balances": member_balances,
        }

    @staticmethod
    def calculate_dashboard_summary(user):
        total_you_owe = Decimal("0.00")
        total_you_are_owed = Decimal("0.00")

        groups = user.group_memberships.select_related("group").prefetch_related("group__members__user", "group__expenses__participants", "group__settlements")
        for membership in groups:
            group = membership.group
            _, balances, _expenses = BalanceService._group_member_balances(group)
            user_balance = balances.get(user.id, Decimal("0.00"))
            if user_balance < 0:
                total_you_owe += abs(user_balance)
            elif user_balance > 0:
                total_you_are_owed += user_balance

        return {
            "total_you_owe": total_you_owe.quantize(Decimal("0.01")),
            "total_you_are_owed": total_you_are_owed.quantize(Decimal("0.01")),
            "net_balance": (total_you_are_owed - total_you_owe).quantize(Decimal("0.01")),
        }

    @staticmethod
    def get_group_summary(group):
        members, balances, expenses = BalanceService._group_member_balances(group)
        settlements = group.settlements.select_related("paid_by", "paid_to").all()

        member_summaries = []
        for member in members:
            member_summaries.append(
                {
                    "user": {"id": member.user_id, "username": member.user.username, "email": member.user.email},
                    "balance": balances.get(member.user_id, Decimal("0.00")).quantize(Decimal("0.01")),
                    "role": member.role,
                }
            )

        return {
            "group": {"id": group.id, "name": group.name},
            "members": member_summaries,
            "net_group_balance": sum(balances.values(), Decimal("0.00")).quantize(Decimal("0.01")),
            "total_expenses": sum((expense.amount for expense in expenses), Decimal("0.00")).quantize(Decimal("0.01")),
            "total_settlements": sum((settlement.amount for settlement in settlements), Decimal("0.00")).quantize(Decimal("0.01")),
        }

    @staticmethod
    def get_user_dashboard(user):
        summary = BalanceService.calculate_dashboard_summary(user)
        return {"user": {"id": user.id, "username": user.username, "email": user.email}, **summary}