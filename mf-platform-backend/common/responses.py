"""Shortcut response helpers enforcing a consistent envelope.

Envelope:
    success -> {"data": <payload>, "error": null}
    error   -> {"data": null, "error": {"code", "message", "details"}}
"""
from __future__ import annotations

from typing import Any

from rest_framework import status as http_status
from rest_framework.response import Response


def ok(data: Any = None, status: int = http_status.HTTP_200_OK) -> Response:
    """Return a 200 success response with the standard envelope."""
    return Response({"data": data, "error": None}, status=status)


def created(data: Any = None) -> Response:
    """Return a 201 Created response with the standard envelope."""
    return Response({"data": data, "error": None}, status=http_status.HTTP_201_CREATED)


def error(
    code: str,
    message: str,
    status: int = http_status.HTTP_400_BAD_REQUEST,
    details: Any | None = None,
) -> Response:
    """Return an error response with the standard envelope."""
    return Response(
        {
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        },
        status=status,
    )


__all__ = ["ok", "created", "error"]
