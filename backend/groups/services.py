from django.db import transaction

from .models import Group, GroupMember


class GroupService:
    @staticmethod
    @transaction.atomic
    def create_group(*, creator, name, description=""):
        group = Group.objects.create(name=name, description=description, created_by=creator)
        GroupMember.objects.create(group=group, user=creator, role=GroupMember.Role.ADMIN)
        return group

    @staticmethod
    @transaction.atomic
    def add_member(*, group, user, role=GroupMember.Role.MEMBER):
        membership, created = GroupMember.objects.get_or_create(group=group, user=user, defaults={"role": role})
        if not created:
            membership.role = role
            membership.save(update_fields=["role"])
        return membership

    @staticmethod
    def remove_member(*, group, user):
        GroupMember.objects.filter(group=group, user=user).delete()