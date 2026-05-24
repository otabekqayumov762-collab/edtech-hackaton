"""DRF exception handling and custom API exceptions.

Provides a consistent error envelope:
    {"data": null, "error": {"code": str, "message": str, "details": Any}}

To enable globally, set in Django settings:
    REST_FRAMEWORK = {
        "EXCEPTION_HANDLER": "common.exceptions.custom_exception_handler",
    }
"""
from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _extract_code_and_message(exc: Exception, data: Any) -> tuple[str, str]:
    """Best-effort extraction of (code, message) from an exception payload."""
    # APIException carries .default_code and .detail (which can be str/list/dict)
    default_code = getattr(exc, "default_code", None) or exc.__class__.__name__
    code: str = str(default_code)
    message: str

    if isinstance(data, dict):
        # DRF validation errors are usually dicts of field -> [msgs]
        # Use the first field's first message as the human message.
        first_key = next(iter(data), None)
        if first_key is None:
            message = "Validation error"
        else:
            value = data[first_key]
            if isinstance(value, list) and value:
                message = str(value[0])
            elif isinstance(value, dict):
                # Nested error — fall back to a generic message.
                message = "Validation error"
            else:
                message = str(value)
            # If field-level, include field name in code for clarity.
            if first_key != "detail" and first_key != "non_field_errors":
                code = f"{code}:{first_key}"
    elif isinstance(data, list) and data:
        message = str(data[0])
    else:
        message = str(data) if data is not None else "Error"

    return code, message


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Wrap DRF's default exception handler to enforce a consistent envelope.

    Returns ``None`` for unhandled exceptions so Django's default 500 flow runs.
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    code, message = _extract_code_and_message(exc, response.data)
    details = response.data if response.data not in (None, "") else None

    response.data = {
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }
    return response


class NoLivesLeft(APIException):
    """Raised when a user has no lives remaining to perform an action."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Jonlaringiz tugadi. Keyinroq urinib ko‘ring."
    default_code = "no_lives_left"


class AlreadyAnswered(APIException):
    """Raised when a user tries to answer the same question twice."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Bu savolga allaqachon javob bergansiz."
    default_code = "already_answered"


class TournamentClosed(APIException):
    """Raised when an action targets a tournament that is not open."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Turnir yopilgan yoki hali ochilmagan."
    default_code = "tournament_closed"


__all__ = [
    "custom_exception_handler",
    "NoLivesLeft",
    "AlreadyAnswered",
    "TournamentClosed",
]
