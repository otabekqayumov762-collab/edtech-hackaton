"""Views for the ``ai_assistant`` app — chat sessions and ``/ask/``."""
from __future__ import annotations

from django.db import transaction
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatMessage, ChatSession
from .serializers import (
    AskSerializer,
    ChatMessageSerializer,
    ChatSessionSerializer,
)
from .services import greeting, reply


class ChatSessionViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """REST endpoints for :class:`ChatSession`.

    * ``GET /api/v1/ai/sessions/`` — list the current user's sessions.
    * ``POST /api/v1/ai/sessions/`` — start a new session (auto-adds
      the AI greeting message).
    * ``GET /api/v1/ai/sessions/<id>/`` — retrieve a session with the
      full nested message history.
    """

    serializer_class = ChatSessionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self) -> QuerySet[ChatSession]:
        """Restrict to sessions owned by the requesting user."""
        user = self.request.user
        if not user.is_authenticated:
            return ChatSession.objects.none()
        return (
            ChatSession.objects.filter(user=user)
            .prefetch_related('messages')
            .order_by('-started_at')
        )

    def create(self, request: Request, *args, **kwargs) -> Response:
        """Create a new chat session and seed it with an AI greeting."""
        with transaction.atomic():
            session = ChatSession.objects.create(user=request.user)
            ChatMessage.objects.create(
                session=session,
                role='ai',
                text=greeting(request.user),
            )
        data = ChatSessionSerializer(session).data
        return Response(data, status=status.HTTP_201_CREATED)


class AskView(APIView):
    """``POST /api/v1/ai/ask/`` — append a user message and get an AI reply.

    Request body::

        {
            "session_id": "<uuid>",   # optional — created if missing
            "text": "..."
        }

    Response::

        {
            "session_id": "<uuid>",
            "user_message": {...},
            "ai_message": {...}
        }
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        """Persist the user message + AI reply and return both."""
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text: str = serializer.validated_data['text']
        session_id = serializer.validated_data.get('session_id')

        with transaction.atomic():
            if session_id is None:
                session = ChatSession.objects.create(user=request.user)
                ChatMessage.objects.create(
                    session=session,
                    role='ai',
                    text=greeting(request.user),
                )
            else:
                session = get_object_or_404(
                    ChatSession,
                    pk=session_id,
                    user=request.user,
                )

            user_msg = ChatMessage.objects.create(
                session=session,
                role='user',
                text=text,
            )
            ai_msg = ChatMessage.objects.create(
                session=session,
                role='ai',
                text=reply(request.user, text),
            )

        return Response(
            {
                'session_id': str(session.id),
                'user_message': ChatMessageSerializer(user_msg).data,
                'ai_message': ChatMessageSerializer(ai_msg).data,
            },
            status=status.HTTP_201_CREATED,
        )
