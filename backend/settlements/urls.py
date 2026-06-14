from django.urls import path

from .views import SettlementViewSet

settlement_list = SettlementViewSet.as_view({"get": "list", "post": "create"})
settlement_detail = SettlementViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("", settlement_list, name="settlement-list"),
    path("<int:settlement_id>/", settlement_detail, name="settlement-detail"),
]