from decimal import Decimal

from django.db import transaction

from common.utils import quantize_money, split_evenly
from groups.models import Group, GroupMember

from .models import Expense, ExpenseParticipant


class ExpenseService:
    @staticmethod
    def calculate_equal_split(amount, participants):
        owed_amounts = split_evenly(quantize_money(amount), len(participants))
        return [
            {
                "user": participant["user"],
                "amount_owed": owed_amounts[index],
                "percentage": None,
                "shares": Decimal("1"),
            }
            for index, participant in enumerate(participants)
        ]

    @staticmethod
    def calculate_unequal_split(amount, participants):
        total = sum((quantize_money(participant["amount"]) for participant in participants), Decimal("0.00"))
        if quantize_money(total) != quantize_money(amount):
            raise ValueError("Unequal splits must total the expense amount")
        return [
            {
                "user": participant["user"],
                "amount_owed": quantize_money(participant["amount"]),
                "percentage": None,
                "shares": Decimal("1"),
            }
            for participant in participants
        ]

    @staticmethod
    def calculate_percentage_split(amount, participants):
        total_percentage = sum((Decimal(str(participant["percentage"])) for participant in participants), Decimal("0.00"))
        if quantize_money(total_percentage) != Decimal("100.00"):
            raise ValueError("Percentage splits must total 100%")

        allocated = []
        running_total = Decimal("0.00")
        for index, participant in enumerate(participants):
            percentage = Decimal(str(participant["percentage"]))
            if index == len(participants) - 1:
                owed = quantize_money(amount - running_total)
            else:
                owed = quantize_money(quantize_money(amount) * percentage / Decimal("100"))
                running_total += owed
            allocated.append(
                {
                    "user": participant["user"],
                    "amount_owed": owed,
                    "percentage": percentage,
                    "shares": Decimal("1"),
                }
            )
        return allocated

    @staticmethod
    def calculate_share_split(amount, participants):
        total_shares = sum((Decimal(str(participant["shares"])) for participant in participants), Decimal("0.00"))
        if total_shares <= 0:
            raise ValueError("Share splits must include at least one positive share")

        amount_per_share = quantize_money(amount) / total_shares
        allocated = []
        running_total = Decimal("0.00")
        for index, participant in enumerate(participants):
            share_value = Decimal(str(participant["shares"]))
            if index == len(participants) - 1:
                owed = quantize_money(amount - running_total)
            else:
                owed = quantize_money(amount_per_share * share_value)
                running_total += owed
            allocated.append(
                {
                    "user": participant["user"],
                    "amount_owed": owed,
                    "percentage": None,
                    "shares": share_value,
                }
            )
        return allocated

    @staticmethod
    @transaction.atomic
    def create_expense(*, creator, group: Group, description, amount, paid_by, split_type, participants):
        expense = Expense.objects.create(
            group=group,
            description=description,
            amount=quantize_money(amount),
            paid_by=paid_by,
            split_type=split_type,
            created_by=creator,
        )

        allocations = ExpenseService._build_allocations(expense.amount, split_type, participants)
        participant_users = {item["user"] for item in allocations}
        member_ids = set(GroupMember.objects.filter(group=group, user__in=participant_users).values_list("user_id", flat=True))
        if member_ids != {user.id for user in participant_users}:
            raise ValueError("All expense participants must be group members")

        ExpenseParticipant.objects.bulk_create(
            [
                ExpenseParticipant(
                    expense=expense,
                    user=item["user"],
                    amount_owed=item["amount_owed"],
                    percentage=item.get("percentage"),
                    shares=item.get("shares"),
                )
                for item in allocations
            ]
        )
        return expense

    @staticmethod
    def _build_allocations(amount, split_type, participants):
        if split_type == Expense.SplitType.EQUAL:
            return ExpenseService.calculate_equal_split(amount, participants)

        if split_type == Expense.SplitType.UNEQUAL:
            return ExpenseService.calculate_unequal_split(amount, participants)

        if split_type == Expense.SplitType.PERCENTAGE:
            return ExpenseService.calculate_percentage_split(amount, participants)

        return ExpenseService.calculate_share_split(amount, participants)