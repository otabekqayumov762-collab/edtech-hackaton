"""CMS app uchun URL marshrutlari.

Barcha endpointlar public (AllowAny). config/urls.py ichida `/api/v1/cms/`
prefiks ostida ulanadi.
"""
from __future__ import annotations

from django.urls import path

from .views import (
    CurrentAnnouncementView,
    FaqItemListView,
    FeatureBlockListView,
    HeroContentView,
    SiteSettingView,
    TestimonialListView,
)

app_name = 'cms'

urlpatterns = [
    path('settings/', SiteSettingView.as_view(), name='site-settings'),
    # Frontend zamonaviy yo'l nomlari — site-config, footer-links, faq, testimonials.
    path('site-config/', SiteSettingView.as_view(), name='site-config'),
    path('hero/', HeroContentView.as_view(), name='hero'),
    path('features/', FeatureBlockListView.as_view(), name='features'),
    path('footer-links/', FeatureBlockListView.as_view(), name='footer-links'),
    path('faq/', FaqItemListView.as_view(), name='faq'),
    path('testimonials/', TestimonialListView.as_view(), name='testimonials'),
    path('announcement/', CurrentAnnouncementView.as_view(), name='announcement'),
]
