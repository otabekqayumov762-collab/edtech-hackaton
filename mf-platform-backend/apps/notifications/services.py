"""Notification composing services — AI (Groq) + template fallback.

Asosiy entrypoint:
* :func:`dispatch(user, ntype)` — type bo'yicha to'g'ri compose_* ni chaqiradi.
* :func:`in_quiet_hours(user)` — push'ni yuborishdan oldin filter.
"""
from __future__ import annotations

import json
import os
import random
import urllib.request
from urllib.error import HTTPError, URLError

from django.utils import timezone

from .models import Notification, UserNotificationPrefs
from .templates_seed import TEMPLATES


GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile')
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

SYSTEM_PROMPT = (
    "Sen — universitetga tayyorlanayotgan o'zbek 9-11 sinf o'quvchisi uchun "
    "motivatsion koach. Qisqa, kuchli, ilhomli xabar yoz (max 120 belgi). "
    "Bosim qilma, qiziq tilda yoz. Ba'zida hazil qo'sh. Emoji 1 ta dan "
    "oshmasin. Faqat o'zbekcha (lotin)."
)


def _ai_message(prompt: str, fallback: str) -> str:
    """Groq'ga so'rov yuboradi. Xato bo'lsa fallback'ni qaytaradi."""
    if not GROQ_API_KEY:
        return fallback
    try:
        data = json.dumps({
            'model': GROQ_MODEL,
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt},
            ],
            'temperature': 0.85,
            'max_tokens': 80,
        }).encode('utf-8')
        req = urllib.request.Request(
            GROQ_URL,
            data=data,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            body = json.loads(r.read().decode('utf-8'))
            content = body['choices'][0]['message']['content']
            return content.strip().strip('"')[:280]
    except (HTTPError, URLError, TimeoutError, KeyError, ValueError):
        return fallback
    except Exception:
        return fallback


def _slot_for_now() -> str:
    """Joriy soat bo'yicha slot (morning/day/evening)."""
    h = timezone.localtime().hour
    if 6 <= h < 11:
        return 'morning'
    if 11 <= h < 17:
        return 'day'
    return 'evening'


def _pick_template(ntype: str) -> tuple[str, str, str]:
    items = TEMPLATES.get(ntype, [])
    if not items:
        return ('default', 'Eslatma', 'Bugungi planni unutma')
    return random.choice(items)


def _format(body: str, ctx: dict) -> str:
    try:
        return body.format(**ctx)
    except Exception:
        return body


def compose_daily(user) -> Notification:
    """Bugungi reja eslatmasi — slot'ga qarab AI matn yoki template."""
    slot = _slot_for_now()
    slug, title, body_tmpl = _pick_template('daily')
    ctx = {
        'minutes': getattr(user, 'daily_goal', 5) * 4,
        'streak': getattr(user, 'streak', 0),
        'name': getattr(user, 'name', ''),
    }
    body = _format(body_tmpl, ctx)
    weak = ', '.join(getattr(user, 'weak_subjects', []) or [])
    prompt = (
        f"User goal: universitetga kirish. Streak: {getattr(user, 'streak', 0)} kun. "
        f"Zaif fan: {weak or 'aralash'}. Slot: {slot}. "
        "Qisqa motivatsion xabar yoz."
    )
    ai_body = _ai_message(prompt, body)
    return Notification.objects.create(
        user=user,
        type='daily',
        title=title,
        body=ai_body,
        source='ai' if ai_body != body else 'template',
    )


def compose_motivation(user) -> Notification:
    """Sof motivatsion xabar — AI birinchi, template fallback."""
    slug, title, body_tmpl = _pick_template('motivation')
    xp = getattr(user, 'xp', 0)
    prompt = (
        f"Streak: {getattr(user, 'streak', 0)}, XP: {xp}, "
        f"level: {(xp // 100) + 1}. 1 jumla motivatsion gap."
    )
    body = _ai_message(prompt, body_tmpl)
    return Notification.objects.create(
        user=user,
        type='motivation',
        title=title,
        body=body,
        source='ai',
    )


def compose_streak(user) -> Notification:
    """Streak haqida xabar — template + format."""
    s = getattr(user, 'streak', 0) or 0
    xp = getattr(user, 'xp', 0)
    slug, title, body_tmpl = _pick_template('streak')
    body = _format(body_tmpl, {'streak': s, 'level': (xp // 100) + 1})
    title = _format(title, {'streak': s})
    return Notification.objects.create(
        user=user,
        type='streak',
        title=title,
        body=body,
        source='template',
    )


def compose_reward(user) -> Notification:
    """Reward eslatmasi — daraja yoki daily box."""
    slug, title, body_tmpl = _pick_template('reward')
    xp = getattr(user, 'xp', 0)
    body = _format(body_tmpl, {'level': (xp // 100) + 1})
    return Notification.objects.create(
        user=user,
        type='reward',
        title=title,
        body=body,
        source='template',
    )


def compose_comeback(user) -> Notification:
    """Foydalanuvchi 1-2 kun kirmaganda yumshoq qaytarish."""
    slug, title, body_tmpl = _pick_template('comeback')
    prompt = (
        f"User 1-2 kun kirmadi. Streak edi: {getattr(user, 'streak', 0)}. "
        "Mehribon, hazilli qaytarish xabari."
    )
    body = _ai_message(prompt, body_tmpl)
    prefs, _ = UserNotificationPrefs.objects.get_or_create(user=user)
    prefs.last_comeback_sent = timezone.now()
    prefs.save(update_fields=['last_comeback_sent'])
    return Notification.objects.create(
        user=user,
        type='comeback',
        title=title,
        body=body,
        source='ai',
    )


def dispatch(user, ntype: str) -> Notification:
    """Notification type bo'yicha compose_* funksiyasini chaqiradi."""
    if ntype == 'daily':
        return compose_daily(user)
    if ntype == 'motivation':
        return compose_motivation(user)
    if ntype == 'streak':
        return compose_streak(user)
    if ntype == 'reward':
        return compose_reward(user)
    if ntype == 'comeback':
        return compose_comeback(user)
    raise ValueError(f'Unknown type: {ntype}')


def in_quiet_hours(user) -> bool:
    """True qaytarsa — hozir push yubormaslik kerak."""
    prefs, _ = UserNotificationPrefs.objects.get_or_create(user=user)
    if not prefs.push_enabled:
        return True
    now = timezone.localtime().time()
    start, end = prefs.quiet_start, prefs.quiet_end
    if start <= end:
        return start <= now < end
    return now >= start or now < end
