"""CMS — admin paneldan tahrirlanadigan sayt mazmuni modellari."""
from __future__ import annotations

from django.db import models


class SiteSetting(models.Model):
    """Sayt global sozlamalari — singleton-like."""

    site_name = models.CharField(max_length=120, default='MF Platform')
    tagline = models.CharField(
        max_length=200,
        blank=True,
        default="Ta'limni o'yin darajasiga olib chiqamiz",
    )
    contact_email = models.EmailField(default='info@mfplatform.uz')
    contact_phone = models.CharField(max_length=40, blank=True, default='+998 90 123 45 67')
    website_url = models.URLField(default='https://mfplatform.uz')
    telegram = models.CharField(max_length=80, blank=True, default='@mfplatform_uz')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Sayt sozlamasi'
        verbose_name_plural = 'Sayt sozlamasi'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.site_name


class HeroContent(models.Model):
    """Landing hero — sarlavha va matn."""

    headline_line1 = models.CharField(max_length=120, default="Har kuni o'rgan.")
    headline_line2 = models.CharField(max_length=120, default='Har kuni darajangni oshir.')
    description = models.TextField(
        default=(
            "9–11 sinf uchun majburiy fanlar — Matematika, Ingliz, Fanlar, Mantiq — "
            "qisqa, qiziqarli o'yin-darslar."
        ),
    )
    primary_button_text = models.CharField(max_length=40, default='Bepul boshlash')
    secondary_button_text = models.CharField(
        max_length=40,
        default="Demo bilan kirib ko'rish",
    )
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hero kontenti'
        verbose_name_plural = 'Hero kontenti'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.headline_line1


class FeatureBlock(models.Model):
    """Imkoniyatlar kartochkalari."""

    icon = models.CharField(
        max_length=40,
        help_text='Lucide ikon nomi (masalan: Gamepad2)',
    )
    title = models.CharField(max_length=80)
    description = models.CharField(max_length=300)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Imkoniyat bloki'
        verbose_name_plural = 'Imkoniyat bloklari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.title


class FaqItem(models.Model):
    """Tez-tez beriladigan savollar."""

    question = models.CharField(max_length=200)
    answer = models.TextField()
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'FAQ savoli'
        verbose_name_plural = 'FAQ savollari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.question


class Testimonial(models.Model):
    """Foydalanuvchi sharhlari."""

    name = models.CharField(max_length=80)
    region = models.CharField(max_length=80, blank=True)
    avatar_color = models.CharField(max_length=8, default='#a5b4fc')
    quote = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Foydalanuvchi sharhi'
        verbose_name_plural = 'Foydalanuvchi sharhlari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class Announcement(models.Model):
    """Tepada body chiqadigan e'lonlar — admin yoqishi mumkin."""

    text = models.CharField(max_length=300)
    link_url = models.URLField(blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "E'lon"
        verbose_name_plural = "E'lonlar"

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.text[:60]


class PricingPlan(models.Model):
    """Tariflar — Landing/Pricing sahifalarida ko'rsatiladi."""

    slug = models.SlugField(unique=True, max_length=64)
    name = models.CharField(max_length=80)  # Bepul / Premium / Premium+
    price_text = models.CharField(max_length=40)  # "0 so'm" / "49 900 so'm / oy"
    price_value = models.PositiveIntegerField(default=0)  # so'mlarda
    icon = models.CharField(max_length=40, default='Crown')
    description = models.CharField(max_length=200, blank=True)
    is_popular = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Tarif rejasi'
        verbose_name_plural = 'Tarif rejalari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class PricingFeature(models.Model):
    """Tarif rejasiga kiritilgan imkoniyat qatori."""

    plan = models.ForeignKey(
        PricingPlan,
        on_delete=models.CASCADE,
        related_name='features',
    )
    label = models.CharField(max_length=160)
    included = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=100)

    class Meta:
        ordering = ['plan', 'sort_order']
        verbose_name = 'Tarif imkoniyati'
        verbose_name_plural = 'Tarif imkoniyatlari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'{self.plan_id}: {self.label}'


class ProcessStep(models.Model):
    """Qanday ishlaydi sektsiyasi — 6 qadam."""

    step_number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=80)
    description = models.CharField(max_length=300)
    icon = models.CharField(max_length=40, default='Target')
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['step_number']
        verbose_name = 'Jarayon qadami'
        verbose_name_plural = 'Jarayon qadamlari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'{self.step_number}. {self.title}'


class StatBadge(models.Model):
    """Landing hero / About — katta statistika raqamlari."""

    KIND_CHOICES = [
        ('users', 'Foydalanuvchilar'),
        ('tests', 'Testlar'),
        ('lessons', 'Darslar'),
        ('xp', 'Jami XP'),
        ('custom', 'Boshqa'),
    ]

    kind = models.CharField(max_length=12, choices=KIND_CHOICES, default='custom')
    label = models.CharField(max_length=80)
    value = models.CharField(max_length=40)  # "10K+" / "98%"
    icon = models.CharField(max_length=40, default='TrendingUp')
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Statistika ko\'rsatkichi'
        verbose_name_plural = 'Statistika ko\'rsatkichlari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'{self.label}: {self.value}'


class TeamMember(models.Model):
    """Team page uchun."""

    name = models.CharField(max_length=80)
    role = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
    avatar_color = models.CharField(max_length=12, default='#a5b4fc')
    telegram = models.CharField(max_length=80, blank=True)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order']
        verbose_name = 'Jamoa a\'zosi'
        verbose_name_plural = 'Jamoa a\'zolari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.name


class NavLink(models.Model):
    """Top nav va footer linklar — admin'dan boshqariladi."""

    LOCATION_CHOICES = [
        ('top', 'Top navbar'),
        ('footer-product', 'Footer: Platforma'),
        ('footer-company', 'Footer: Kompaniya'),
        ('footer-help', 'Footer: Yordam'),
    ]

    location = models.CharField(max_length=18, choices=LOCATION_CHOICES)
    label = models.CharField(max_length=80)
    url = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['location', 'sort_order']
        verbose_name = 'Navigatsiya havolasi'
        verbose_name_plural = 'Navigatsiya havolalari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'[{self.location}] {self.label}'


class CTA(models.Model):
    """CTA tugma matnlari — har sahifa uchun."""

    slug = models.SlugField(unique=True, max_length=64)  # 'hero-primary', 'pricing-cta'
    label = models.CharField(max_length=80)
    url = models.CharField(max_length=200)
    icon = models.CharField(max_length=40, blank=True)
    variant = models.CharField(max_length=20, default='primary')  # primary/dark/ghost/gold
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'CTA tugma'
        verbose_name_plural = 'CTA tugmalar'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f'{self.slug} — {self.label}'


class TextSnippet(models.Model):
    """Universal — istalgan joyda matn (key-value)."""

    key = models.SlugField(unique=True, max_length=64)
    label = models.CharField(max_length=120, blank=True)  # admin uchun tushuntirish
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']
        verbose_name = 'Matn bo\'lagi'
        verbose_name_plural = 'Matn bo\'laklari'

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.key
