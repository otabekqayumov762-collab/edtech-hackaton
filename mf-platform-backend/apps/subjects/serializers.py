"""Serializers for the ``subjects`` app."""
from __future__ import annotations

from rest_framework import serializers

from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    """Serialize :class:`Subject` to match the frontend ``Subject`` shape.

    Computed counts (``topics_count``, ``tests_count``) are exposed as
    read-only integer fields backed by model ``@property`` accessors.
    """

    slug = serializers.CharField(source='id', read_only=True)
    topics = serializers.IntegerField(source='topics_count', read_only=True)
    tests = serializers.IntegerField(source='tests_count', read_only=True)
    topics_count = serializers.IntegerField(read_only=True)
    tests_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = (
            'id',
            'slug',
            'name',
            'short',
            'icon',
            'color',
            'order',
            'is_active',
            'topics',
            'tests',
            'topics_count',
            'tests_count',
        )
        read_only_fields = fields
