"""Push xabar shablonlari — AI ishlamasa fallback sifatida ishlatiladi.

Har type uchun bir nechta variant — random.choice() bilan tanlanadi.
Format kalitlari: {minutes}, {streak}, {level}, {name}.
"""
from __future__ import annotations


TEMPLATES: dict[str, list[tuple[str, str, str]]] = {
    'daily': [
        ('daily-morning', 'Bugungi reja tayyor', "Bugun {minutes} minut ajrat — ertangi natija o'zgaradi"),
        ('daily-day',     'Bugun ham davom et', 'Senga faqat {minutes} minut kerak'),
        ('daily-evening', 'Kunni yopib ket',    'Bugungi planni tugatish vaqti keldi'),
    ],
    'motivation': [
        ('mot-power',     'Sen kuchlisan',      "Sen o'ylagandan kuchlisan, davom et"),
        ('mot-step',      'Kichik qadamlar',    'Har kuni 1% yaxshilan — yil oxirida 38x kuchaysan'),
        ('mot-goal',      'Maqsadga yaqinmiz',  "Bugungi mehnat — ertangi g'alaba"),
    ],
    'streak': [
        ('streak-3',  'Seriya: {streak} kun!', "Davom et — streakni yo'qotma"),
        ('streak-7',  '7 kunlik seriya!',      "Sen zo'r ketayapsan, respect"),
        ('streak-30', '30 kun ketma-ket!',     'Bu allaqachon odat — sen yengilmassan'),
    ],
    'reward': [
        ('reward-daily', 'Bugungi reward tayyor', 'Daily boxni ochishni unutma'),
        ('reward-level', 'Yangi daraja!',         'Level {level} — yangi imkoniyatlar ochildi'),
    ],
    'comeback': [
        ('come-1day',  "Seni sog'indik",      "Bir kun bo'ldi — qaytib kel"),
        ('come-2day',  'Yana boshlash vaqti', 'Streakni qaytadan tiklashga ulgurasan'),
        ('come-week',  'Kech emas',           'Sen tashlamading — bugun qayt'),
    ],
}
