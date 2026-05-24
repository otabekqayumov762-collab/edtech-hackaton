"""Reusable DRF throttle classes.

These rely on DRF's default scoped/anon/user throttle infrastructure.
Configure rates in ``REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']`` using
the scope names defined on each class, e.g.::

    REST_FRAMEWORK = {
        "DEFAULT_THROTTLE_RATES": {
            "anon": "60/min",
            "user": "300/min",
            "login": "10/min",
        },
    }
"""
from __future__ import annotations

from rest_framework.throttling import (
    AnonRateThrottle,
    ScopedRateThrottle,
    UserRateThrottle,
)


class BurstAnonRateThrottle(AnonRateThrottle):
    """Anonymous burst limit: 60 requests per minute."""

    scope = "anon"
    rate = "60/min"


class BurstUserRateThrottle(UserRateThrottle):
    """Authenticated user burst limit: 300 requests per minute."""

    scope = "user"
    rate = "300/min"


class LoginRateThrottle(ScopedRateThrottle):
    """Throttle dedicated to the login endpoint: 10 attempts per minute.

    Attach to the login view via ``throttle_classes = [LoginRateThrottle]``
    and ``throttle_scope = 'login'`` (or let this class supply the scope).
    """

    scope = "login"
    rate = "10/min"

    def get_rate(self) -> str:  # type: ignore[override]
        # Prefer DEFAULT_THROTTLE_RATES['login'] if configured, else fall back.
        try:
            return super().get_rate() or self.rate
        except Exception:
            return self.rate


__all__ = ["BurstAnonRateThrottle", "BurstUserRateThrottle", "LoginRateThrottle"]
