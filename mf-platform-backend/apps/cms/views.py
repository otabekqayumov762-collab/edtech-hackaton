"""CMS uchun public, read-only DRF view'lari."""
from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CTA,
    Announcement,
    FaqItem,
    FeatureBlock,
    HeroContent,
    NavLink,
    PricingPlan,
    ProcessStep,
    SiteSetting,
    StatBadge,
    TeamMember,
    Testimonial,
    TextSnippet,
)
from .serializers import (
    AnnouncementSerializer,
    CTASerializer,
    FaqItemSerializer,
    FeatureBlockSerializer,
    HeroContentSerializer,
    NavLinkSerializer,
    PricingPlanSerializer,
    ProcessStepSerializer,
    SiteSettingSerializer,
    StatBadgeSerializer,
    TeamMemberSerializer,
    TestimonialSerializer,
    TextSnippetSerializer,
)


class SiteSettingView(APIView):
    """`GET /api/v1/cms/settings` — singleton sozlamalar."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):  # noqa: D401
        """Birinchi yozuvni qaytaradi, mavjud bo'lmasa default qiymatlar."""
        obj = SiteSetting.objects.first()
        if obj is None:
            obj = SiteSetting()
        return Response(SiteSettingSerializer(obj).data)


class HeroContentView(APIView):
    """`GET /api/v1/cms/hero` — joriy faol hero."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):  # noqa: D401
        """Active=True bo'lgan oxirgi yozuvni qaytaradi."""
        obj = HeroContent.objects.filter(active=True).order_by('-updated_at').first()
        if obj is None:
            obj = HeroContent()
        return Response(HeroContentSerializer(obj).data)


class FeatureBlockListView(generics.ListAPIView):
    """`GET /api/v1/cms/features` — faol imkoniyatlar ro'yxati."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = FeatureBlockSerializer
    pagination_class = None

    def get_queryset(self):  # noqa: D401
        """Active=True bloklar, sort_order tartibida."""
        return FeatureBlock.objects.filter(active=True).order_by('sort_order')


class FaqItemListView(generics.ListAPIView):
    """`GET /api/v1/cms/faq` — faol FAQ ro'yxati."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = FaqItemSerializer
    pagination_class = None

    def get_queryset(self):  # noqa: D401
        """Active=True savollar, sort_order tartibida."""
        return FaqItem.objects.filter(active=True).order_by('sort_order')


class TestimonialListView(generics.ListAPIView):
    """`GET /api/v1/cms/testimonials` — faol sharhlar ro'yxati."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = TestimonialSerializer
    pagination_class = None

    def get_queryset(self):  # noqa: D401
        """Active=True sharhlar, sort_order tartibida."""
        return Testimonial.objects.filter(active=True).order_by('sort_order')


class CurrentAnnouncementView(APIView):
    """`GET /api/v1/cms/announcement` — joriy faol e'lon yoki bo'sh javob."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):  # noqa: D401
        """Sana oralig'ida bo'lgan birinchi faol e'lonni qaytaradi."""
        now = timezone.now()
        qs = Announcement.objects.filter(active=True)
        qs = qs.filter(Q(starts_at__isnull=True) | Q(starts_at__lte=now))
        qs = qs.filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
        obj = qs.order_by('-created_at').first()
        if obj is None:
            return Response(None)
        return Response(AnnouncementSerializer(obj).data)
