from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Group, GroupMember

User = get_user_model()


class GroupMemberSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = GroupMember
        fields = ["id", "user", "role", "joined_at"]

    def get_user(self, obj):
        return {"id": obj.user_id, "username": obj.user.username, "email": obj.user.email}


class GroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "description", "created_by", "created_at", "updated_at", "member_count", "members"]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "member_count", "members"]


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["name", "description"]


class GroupUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["name"]


class GroupMemberAddSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=GroupMember.Role.choices, required=False, default=GroupMember.Role.MEMBER)

    def __init__(self, *args, **kwargs):
        self.group = kwargs.pop("group", None)
        super().__init__(*args, **kwargs)


    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")
        if self.group and GroupMember.objects.filter(group=self.group, user_id=value).exists():
            raise serializers.ValidationError("User is already a member of this group")
        return value


class GroupMemberRemoveSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def __init__(self, *args, **kwargs):
        self.group = kwargs.pop("group", None)
        super().__init__(*args, **kwargs)

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")
        if self.group and self.group.created_by_id == value:
            raise serializers.ValidationError("The group creator cannot be removed")
        if self.group and not GroupMember.objects.filter(group=self.group, user_id=value).exists():
            raise serializers.ValidationError("User is not a member of this group")
        return value