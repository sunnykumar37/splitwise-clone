from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GroupViewSet

router = DefaultRouter()
router.register(r"", GroupViewSet, basename="group")

urlpatterns = router.urls + [
	path("<int:group_id>/expenses/", include("expenses.urls")),
	path("<int:group_id>/settlements/", include("settlements.urls")),
]