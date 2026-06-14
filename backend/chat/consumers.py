from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.shortcuts import get_object_or_404

from expenses.models import Expense, ExpenseParticipant
from .models import ExpenseMessage
from .serializers import ExpenseMessageSerializer


class ExpenseChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.expense_id = self.scope["url_route"]["kwargs"]["expense_id"]
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close(code=4401)
            return

        if not await self.is_participant(self.expense_id, self.user.id):
            await self.close(code=4403)
            return

        self.group_name = f"expense_chat_{self.expense_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive_json(self, content, **kwargs):
        message_content = (content.get("message") or "").strip()

        if not message_content:
            await self.send_json({
                "type": "error",
                "message": "Message content is required",
            })
            return

        message = await self.create_message(
            self.expense_id,
            self.user.id,
            message_content,
        )

        serialized = await self.serialize_message(message)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": serialized,
            },
        )

    async def chat_message(self, event):
        await self.send_json(event["message"])

    @database_sync_to_async
    def is_participant(self, expense_id, user_id):
        return ExpenseParticipant.objects.filter(
            expense_id=expense_id,
            user_id=user_id,
        ).exists()

    @database_sync_to_async
    def create_message(self, expense_id, user_id, content):
        expense = get_object_or_404(Expense, id=expense_id)

        message = ExpenseMessage.objects.create(
            expense=expense,
            sender_id=user_id,
            content=content,
        )

        return ExpenseMessage.objects.select_related("sender").get(
            id=message.id
        )

    @database_sync_to_async
    def serialize_message(self, message):
        return ExpenseMessageSerializer(message).data