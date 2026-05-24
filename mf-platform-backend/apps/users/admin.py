"""User admin — Unfold UserAdmin + email/name/plan ko'rinishi.

`unfold.admin.UserAdmin` Django UserAdmin'dan inherit qilib unfold UI'ni
qo'shadi. Paket yo'q bo'lsa toza Django UserAdmin'ga tushadi.
"""
from __future__ import annotations

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

try:
    from unfold.admin import ModelAdmin  # noqa: F401  (registration-time import)
    from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
    _UNFOLD_AVAILABLE = True
except ImportError:  # pragma: no cover - paket o'rnatilmagan vaqtdagi fallback
    _UNFOLD_AVAILABLE = False

User = get_user_model()

# Unfold UserAdmin mavjud bo'lsa undan inherit qilamiz; aks holda toza Django.
if _UNFOLD_AVAILABLE:
    try:
        from unfold.admin import UserAdmin as _UnfoldUserAdmin  # type: ignore[attr-defined]
        _BaseUserAdmin = _UnfoldUserAdmin
    except ImportError:  # eski unfold versiyalari
        _BaseUserAdmin = DjangoUserAdmin
else:
    _BaseUserAdmin = DjangoUserAdmin


@admin.register(User)
class UserAdmin(_BaseUserAdmin):
    """Maxsus User admin — gamification maydonlari bilan."""

    ordering = ('-date_joined',)
    list_display = (
        'email',
        'name',
        'plan',
        'xp',
        'coins',
        'gems',
        'streak',
        'is_active',
        'date_joined',
    )
    list_filter = ('plan', 'is_active', 'grade', 'placement_level')
    search_fields = ('email', 'name')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Profil', {'fields': ('name', 'region', 'grade', 'avatar_color', 'plan')}),
        (
            'Onboarding',
            {'fields': ('daily_minutes', 'weak_subjects', 'placement_level')},
        ),
        (
            'Gamification',
            {
                'fields': (
                    'xp',
                    'coins',
                    'gems',
                    'streak',
                    'last_active_date',
                    'daily_goal',
                    'daily_done',
                    'daily_done_date',
                    'lives',
                    'lives_max',
                    'lives_reset_date',
                    'consecutive_correct',
                ),
            },
        ),
        (
            'Permissions',
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                ),
            },
        ),
        ('Sanalar', {'fields': ('date_joined',)}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'name', 'password1', 'password2'),
            },
        ),
    )
    readonly_fields = ('date_joined',)

    if _UNFOLD_AVAILABLE:
        # Unfold formalarini ulaymiz — UI tugmalari unfold style oladi.
        form = UserChangeForm
        add_form = UserCreationForm
        change_password_form = AdminPasswordChangeForm
