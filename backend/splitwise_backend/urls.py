"""Project URL configuration."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("common.urls")),
    path("api/groups/", include("groups.urls")),
    path("api/expenses/", include("expenses.urls")),
    path("api/settlements/", include("settlements.urls")),
    path("api/chat/", include("chat.urls")),
]