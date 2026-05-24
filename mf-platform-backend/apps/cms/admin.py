"""CMS app uchun Unfold admin sozlamalari."""
from __future__ import annotations

from django.contrib import admin

try:
    from unfold.admin import ModelAdmin
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    ModelAdmin = admin.ModelAdmin  # type: ignore[assignment,misc]

from .models import (
    Announcement,
    FaqItem,
    FeatureBlock,
    HeroContent,
    SiteSetting,
    Testimonial,
)


@admin.register(SiteSetting)
class SiteSettingAdmin(ModelAdmin):
    """Sayt sozlamalari — singleton (bitta yozuv)."""

    list_display = ('site_name', 'contact_email', 'updated_at')

    def has_add_permission(self, request):  # noqa: D401
        """Faqat bitta yozuv mavjud bo'lishi mumkin."""
        return not SiteSetting.objects.exists()


@admin.register(HeroContent)
class HeroContentAdmin(ModelAdmin):
    """Landing hero — sarlavha/matn."""

    list_display = ('headline_line1', 'active', 'updated_at')
    list_filter = ('active',)
    search_fields = ('headline_line1', 'headline_line2', 'description')


@admin.register(FeatureBlock)
class FeatureBlockAdmin(ModelAdmin):
    """Imkoniyatlar kartochkalari."""

    list_display = ('title', 'icon', 'sort_order', 'active')
    list_editable = ('sort_order', 'active')
    list_filter = ('active',)
    search_fields = ('title', 'description', 'icon')


@admin.register(FaqItem)
class FaqItemAdmin(ModelAdmin):
    """FAQ ro'yxati."""

    list_display = ('question', 'sort_order', 'active')
    list_editable = ('sort_order', 'active')
    list_filter = ('active',)
    search_fields = ('question', 'answer')


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    """Foydalanuvchi sharhlari."""

    list_display = ('name', 'region', 'rating', 'active', 'sort_order')
    list_editable = ('sort_order', 'active')
    list_filter = ('active', 'rating')
    search_fields = ('name', 'region', 'quote')


@admin.register(Announcement)
class AnnouncementAdmin(ModelAdmin):
    """Sayt yuqorisidagi e'lonlar."""

    list_display = ('text', 'active', 'starts_at', 'ends_at')
    list_editable = ('active',)
    list_filter = ('active',)
    search_fields = ('text',)
