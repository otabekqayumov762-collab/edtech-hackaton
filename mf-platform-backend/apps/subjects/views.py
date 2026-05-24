"""Views for the ``subjects`` app.

Exposes a read-only list/retrieve API for the canonical subject catalog.
"""
from __future__ import annotations

from rest_framework import permissions, viewsets

from .models import Subject
from .serializers import SubjectSerializer


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only endpoint for active subjects.

    * ``GET /api/v1/subjects/`` — list active subjects.
    * ``GET /api/v1/subjects/<id>/`` — retrieve a single subject by slug.
    """

    serializer_class = SubjectSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None
    queryset = Subject.objects.filter(is_active=True)
    lookup_field = 'pk'

    def get_queryset(self):
        """Return only active subjects, ordered by ``order, name``."""
        return Subject.objects.filter(is_active=True).order_by('order', 'name')
