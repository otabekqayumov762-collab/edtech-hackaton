"""Users app URL config — /auth/ ostiga ulanadi."""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import LoginView, MeView, RegisterView
from .dashboard import DashboardSummaryView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),
    # SimpleJWT token endpoint (email+password)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
]
