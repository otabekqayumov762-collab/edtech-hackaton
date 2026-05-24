"""CMS modellari uchun read-only DRF serializerlari."""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    CTA,
    Announcement,
    FaqItem,
    FeatureBlock,
    HeroContent,
    NavLink,
    PricingFeature,
    PricingPlan,
    ProcessStep,
    SiteSetting,
    StatBadge,
    TeamMember,
    Testimonial,
    TextSnippet,
)


class SiteSettingSerializer(serializers.ModelSerializer):
    """Sayt global sozlamalari."""

    class Meta:
        model = SiteSetting
        fields = (
            'site_name',
            'tagline',
            'contact_email',
            'contact_phone',
            'website_url',
            'telegram',
            'updated_at',
        )


class HeroContentSerializer(serializers.ModelSerializer):
    """Landing hero kontenti."""

    class Meta:
        model = HeroContent
        fields = (
            'headline_line1',
            'headline_line2',
            'description',
            'primary_button_text',
            'secondary_button_text',
            'active',
            'updated_at',
        )


class FeatureBlockSerializer(serializers.ModelSerializer):
    """Imkoniyat kartochkasi."""

    class Meta:
        model = FeatureBlock
        fields = ('id', 'icon', 'title', 'description', 'sort_order')


class FaqItemSerializer(serializers.ModelSerializer):
    """FAQ savoli."""

    class Meta:
        model = FaqItem
        fields = ('id', 'question', 'answer', 'sort_order')


class TestimonialSerializer(serializers.ModelSerializer):
    """Foydalanuvchi sharhi."""

    class Meta:
        model = Testimonial
        fields = (
            'id',
            'name',
            'region',
            'avatar_color',
            'quote',
            'rating',
            'sort_order',
        )


class AnnouncementSerializer(serializers.ModelSerializer):
    """E'lon (banner)."""

    class Meta:
        model = Announcement
        fields = ('id', 'text', 'link_url', 'starts_at', 'ends_at')


class PricingFeatureSerializer(serializers.ModelSerializer):
    """Tarif rejasi imkoniyat qatori."""

    class Meta:
        model = PricingFeature
        fields = ('id', 'label', 'included', 'sort_order')


class PricingPlanSerializer(serializers.ModelSerializer):
    """Tarif rejasi — features nested."""

    features = serializers.SerializerMethodField()

    class Meta:
        model = PricingPlan
        fields = (
            'id',
            'slug',
            'name',
            'price_text',
            'price_value',
            'icon',
            'description',
            'is_popular',
            'sort_order',
            'features',
        )

    def get_features(self, obj: PricingPlan):  # noqa: D401
        """Faqat plan'ga tegishli featurelarni order bo'yicha qaytaradi."""
        qs = obj.features.all().order_by('sort_order', 'id')
        return PricingFeatureSerializer(qs, many=True).data


class ProcessStepSerializer(serializers.ModelSerializer):
    """Qanday ishlaydi sektsiyasi qadami."""

    class Meta:
        model = ProcessStep
        fields = ('id', 'step_number', 'title', 'description', 'icon')


class StatBadgeSerializer(serializers.ModelSerializer):
    """Statistika ko'rsatkichi."""

    class Meta:
        model = StatBadge
        fields = ('id', 'kind', 'label', 'value', 'icon', 'sort_order')


class TeamMemberSerializer(serializers.ModelSerializer):
    """Jamoa a'zosi."""

    class Meta:
        model = TeamMember
        fields = (
            'id',
            'name',
            'role',
            'bio',
            'avatar_color',
            'telegram',
            'sort_order',
        )


class NavLinkSerializer(serializers.ModelSerializer):
    """Navigatsiya havolasi."""

    class Meta:
        model = NavLink
        fields = ('id', 'location', 'label', 'url', 'sort_order')


class CTASerializer(serializers.ModelSerializer):
    """CTA tugma."""

    class Meta:
        model = CTA
        fields = ('id', 'slug', 'label', 'url', 'icon', 'variant')


class TextSnippetSerializer(serializers.ModelSerializer):
    """Universal matn bo'lagi."""

    class Meta:
        model = TextSnippet
        fields = ('id', 'key', 'label', 'value', 'updated_at')
