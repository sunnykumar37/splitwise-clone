from rest_framework import generics, permissions

from common.responses import success_response

from .services import BalanceService


class DashboardAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return success_response(BalanceService.get_user_dashboard(request.user), "Dashboard balance summary")


class DashboardSummaryAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return success_response(BalanceService.calculate_dashboard_summary(request.user), "Dashboard summary")