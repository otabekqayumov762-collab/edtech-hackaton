"""AI reply service — Groq LLM (OpenAI-compatible) + fallback.

Platforma vision'iga muvofiq sozlangan:

* 9–11 sinf o'quvchilari uchun majburiy fanlarni (matematika, ingliz,
  fanlar, mantiq) o'qitadi.
* Faqat "test ber → ball ko'r" emas — o'quvchi xato qilganda **NEGA**
  xato qilganini tushuntiradi.
* AI repetitor sifatida ishlaydi: tushunmagan mavzuni qisqa misol bilan
  ochib beradi, keyin shaxsiy mashq taklif qiladi.
* O'zbek tilida, do'stona, qisqa va aniq.

Groq API kaliti `.env` da `GROQ_API_KEY` orqali beriladi. Agar yo'q
bo'lsa yoki tarmoq xatosi bo'lsa — keyword-based fallback ishlaydi.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.contrib.auth import get_user_model

User = get_user_model()
log = logging.getLogger(__name__)

GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
DEFAULT_MODEL = 'llama-3.3-70b-versatile'

SYSTEM_PROMPT = """\
Sen MF Platform AI repetitorisan — 9–11 sinf o‘quvchilari uchun majburiy fanlar
(matematika, ingliz tili, fanlar, ona tili, mantiq) bo‘yicha shaxsiy o‘qituvchi.

QOIDALAR:
1. O‘zbek tilida (lotin alifbosi) javob ber. Sodda, do‘stona, qisqa.
2. "Yana bir test sayti" emassan — o‘quvchiga NEGA xato qilganini tushuntir.
   Faqat to‘g‘ri javobni aytma — sababini, qoidasini, qaerda chalkashganini
   tushuntir.
3. Iloji bo‘lsa qisqa MISOL bilan ko‘rsat. Uzun ma’ruza yozma.
4. Javobdan keyin 1 ta SHAXSIY MASHQ taklif qil — o‘quvchi shu joyni
   mustahkamlashi uchun. Mashq qisqa va aniq.
5. Foydalanuvchi sinfi, darajasi, oxirgi natijalari kontekstda berilgan
   bo‘lsa — ulardan foydalanib shaxsiylashtir.
6. Format: 2–4 qisqa abzas. Markdown yo‘q (yulduzcha, sarlavha, kod blok yo‘q).
   Matematik formula bo‘lsa unicode ishlat: x² + 2x − 3, √D, ≥, ≤.
7. Hech qachon foydalanuvchini xafa qilma. "Yaxshi savol" kabi ortiqcha
   maqtovlardan qoch — to‘g‘ridan-to‘g‘ri javobga o‘t.
"""


def _first_name(user) -> str:
    """Return the user's first name, falling back to ``do'stim``."""
    name = getattr(user, 'name', '') or ''
    first = name.split(' ', 1)[0].strip()
    return first or 'do‘stim'


def _user_context(user) -> str:
    """Foydalanuvchi haqida LLM uchun qisqa kontekst yig'adi.

    Sinf, daraja, XP, eng zaif fan kabi belgilar prompt'ga qo'shiladi.
    """
    if user is None or not getattr(user, 'is_authenticated', False):
        return ''
    parts = [f"Ism: {_first_name(user)}"]
    grade = getattr(user, 'grade', None)
    if grade:
        parts.append(f"Sinf/daraja: {grade}")
    xp = int(getattr(user, 'xp', 0) or 0)
    streak = int(getattr(user, 'streak', 0) or 0)
    if xp or streak:
        parts.append(f"Joriy XP: {xp}, Streak: {streak} kun")
    return ' · '.join(parts)


def _build_messages(user, history: Iterable[dict] | None, text: str) -> list[dict]:
    """OpenAI chat.completions formatida xabarlar ro'yxatini quradi."""
    messages: list[dict] = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    ctx = _user_context(user)
    if ctx:
        messages.append({'role': 'system', 'content': f'Foydalanuvchi: {ctx}'})
    if history:
        for h in history:
            role = h.get('role')
            content = h.get('text') or h.get('content') or ''
            if not content:
                continue
            # Frontend role nomlari: 'user' / 'ai' → OpenAI: 'user' / 'assistant'
            mapped = 'assistant' if role in ('ai', 'assistant') else 'user'
            messages.append({'role': mapped, 'content': str(content)[:2000]})
    messages.append({'role': 'user', 'content': text[:2000]})
    return messages


def _call_groq(messages: list[dict], *, timeout: float = 8.0) -> str | None:
    """Groq Chat Completions endpoint'iga so'rov yuboradi.

    Returns: AI matni (str) yoki xato bo'lsa None.
    Tashqi paket talab qilmaydi — `urllib` bilan ishlaydi.
    """
    api_key = os.environ.get('GROQ_API_KEY', '').strip()
    if not api_key:
        return None
    model = os.environ.get('GROQ_MODEL', DEFAULT_MODEL).strip() or DEFAULT_MODEL
    payload = json.dumps(
        {
            'model': model,
            'messages': messages,
            'temperature': 0.4,
            'max_tokens': 600,
            'top_p': 0.9,
        }
    ).encode('utf-8')
    req = Request(
        GROQ_API_URL,
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'mf-platform/1.0',
        },
        method='POST',
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode('utf-8')
            data = json.loads(body)
            choices = data.get('choices') or []
            if not choices:
                return None
            content = choices[0].get('message', {}).get('content')
            return (content or '').strip() or None
    except HTTPError as e:
        try:
            err_body = e.read().decode('utf-8', errors='replace')
        except Exception:
            err_body = str(e)
        log.warning('Groq HTTPError %s: %s', e.code, err_body[:300])
        return None
    except (URLError, TimeoutError) as e:
        log.warning('Groq network error: %s', e)
        return None
    except Exception as e:  # pragma: no cover — defensive
        log.exception('Groq unexpected error: %s', e)
        return None


def _fallback_reply(user, text: str) -> str:
    """LLM mavjud bo'lmaganda — sodda keyword javoblar."""
    t = (text or '').lower()
    name = _first_name(user)
    if 'kvadrat' in t or 'tenglama' in t:
        return (
            'Kvadrat tenglama ax² + bx + c = 0 ko‘rinishida bo‘ladi. Avval '
            'diskriminantni toping: D = b² − 4ac. So‘ng x = (−b ± √D) / 2a. '
            'Misol: x² − 5x + 6 = 0 → D = 25 − 24 = 1, x = (5 ± 1) / 2 = 3 va 2.\n\n'
            'Mashq: x² + 4x + 3 = 0 ni yeching va D ni qaytarib hisoblang.'
        )
    if 'fizika' in t:
        return (
            'Fizikada eng ko‘p chalkashlik — birlik o‘zgartirish. Tezlanish '
            'm/s² da, kuch N (kg·m/s²) da. F = m·a → har doim SI birliklarda yozing.\n\n'
            'Mashq: 2 kg massali jismga 10 N kuch ta\'sir qilsa, tezlanish qancha?'
        )
    if 'bugun' in t or 'reja' in t:
        return (
            f'{name}, bugun uchun reja: 1 ta yangi dars (matematika), '
            '1 ta mavzu testi, 10 ta savollik kunlik challenge. Bu kunlik '
            'maqsadingizni yopadi va seriyangizni saqlaydi.'
        )
    return (
        'AI yordamchingiz hozircha oddiy javob beradi (LLM ulanmagan). '
        'Aniqroq fan yoki mavzu nomini yozing, sizga shaxsiy tavsiya beraman.'
    )


def reply(user, text: str, history: list[dict] | None = None) -> str:
    """Foydalanuvchi xabariga AI javobi.

    Args:
        user: So'rov yuborgan User.
        text: Foydalanuvchi xabari.
        history: Oldingi xabarlar ro'yxati (frontend chat tarixi)
            ``[{role:'user'|'ai', text:'...'}]`` formatida.

    Returns:
        AI matni. LLM bo'lmasa — keyword fallback.
    """
    messages = _build_messages(user, history, text)
    ai_text = _call_groq(messages)
    if ai_text:
        return ai_text
    return _fallback_reply(user, text)


def explain_wrong_answer(
    user,
    *,
    question: str,
    options: list[str],
    correct_index: int,
    picked_index: int,
    explanation_hint: str = '',
) -> str:
    """Foydalanuvchi xato javob berganda — NEGA xato qilganini tushuntiradi.

    Bu — platformaning eshik ochar qismi. Faqat to'g'ri javobni aytmaslik:
    sababini, qoidasini, qaerda chalkashganini ochib berish.
    """
    opt_block = '\n'.join(f'  {chr(65 + i)}. {opt}' for i, opt in enumerate(options))
    correct_letter = chr(65 + correct_index)
    picked_letter = chr(65 + picked_index)
    prompt = (
        f"Savol: {question}\n"
        f"Variantlar:\n{opt_block}\n"
        f"Foydalanuvchi tanladi: {picked_letter}\n"
        f"To‘g‘ri javob: {correct_letter}\n"
    )
    if explanation_hint:
        prompt += f"Ishorat: {explanation_hint}\n"
    prompt += (
        '\nFoydalanuvchi NEGA xato qilganini qisqa va aniq tushuntir. '
        'To‘g‘ri javobni alohida ko‘rsat. Oxirida 1 ta mustahkamlash mashqi taklif qil.'
    )
    messages = _build_messages(user, None, prompt)
    ai_text = _call_groq(messages)
    if ai_text:
        return ai_text
    # Fallback — bor explanation'ni qaytaramiz.
    return (
        f"Sizning javobingiz {picked_letter}, to‘g‘ri javob {correct_letter}. "
        + (explanation_hint or 'Mavzuni qaytadan ko‘rib chiqishni tavsiya qilamiz.')
    )


def daily_plan(user) -> str:
    """Foydalanuvchi uchun bugungi shaxsiy reja matni.

    Streak, sinf va zaif fan kontekstidan kelib chiqib LLM 3 ta vazifa
    taklif qiladi.
    """
    ctx = _user_context(user) or 'Yangi foydalanuvchi'
    prompt = (
        f"Foydalanuvchi ma\'lumotlari: {ctx}.\n"
        '20–30 daqiqalik bugungi reja tuz: 3 ta aniq vazifa (qaysi fan, '
        'qaysi turdagi mashq, taxminiy vaqt). Markdown yo\'q, raqamlangan ro\'yxat.'
    )
    messages = _build_messages(user, None, prompt)
    ai_text = _call_groq(messages)
    if ai_text:
        return ai_text
    return (
        '1) Matematika — 1 ta yangi dars (10 daqiqa).\n'
        '2) Mavzu testi — 5 savol (8 daqiqa).\n'
        '3) Kunlik challenge — 10 savol (7 daqiqa).'
    )


def greeting(user) -> str:
    """Yangi suhbat ochilganda dastlabki AI salomi."""
    return (
        f'Salom, {_first_name(user)}! Men MF AI repetitoringman — qaysi '
        'fan yoki mavzuda yordam kerak? Yoki shunchaki "bugungi reja" deb '
        'yozsangiz, sizga shaxsiy plan tuzaman.'
    )
