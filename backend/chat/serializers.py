from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ExpenseMessage

User = get_user_model()


class ExpenseMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    message = serializers.CharField(source="content")

    class Meta:
        model = ExpenseMessage
        fields = ["id", "sender", "message", "created_at"]

    def get_sender(self, obj):
        return {"id": obj.sender_id, "username": obj.sender.username}