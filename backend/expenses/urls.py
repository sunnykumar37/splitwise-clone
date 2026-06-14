from django.urls import include, path

from .views import ExpenseViewSet

expense_list = ExpenseViewSet.as_view({"get": "list", "post": "create"})
expense_detail = ExpenseViewSet.as_view({"get": "retrieve", "delete": "destroy"})

urlpatterns = [
    path("", expense_list, name="expense-list"),
    path("<int:expense_id>/", expense_detail, name="expense-detail"),
    path("<int:expense_id>/messages/", include("chat.urls")),
]