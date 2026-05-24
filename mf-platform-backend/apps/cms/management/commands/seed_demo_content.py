"""Real ta'lim kontentini (Matematika, Ona tili — 6/7-sinf) seed qiluvchi
boshqaruv komandasi.

Frontend `Flashcards` va `Tests` sahifalarida bo'sh massiv qaytmasligi
uchun haqiqiy mavzular, flashcards va testlar yaratiladi. Komanda
idempotent — qayta-qayta ishlatilganda dublikat yaratmaydi (update_or_create).

Ishlatilishi:
    docker compose exec web python manage.py seed_demo_content
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.flashcards.models import FlashCard, FlashTopic
from apps.lessons.models import Lesson
from apps.subjects.models import Subject, Topic
from apps.tests.models import Option, Question, Test


# ---------------------------------------------------------------------------
# CONTENT DATA — barcha matn shu yerda. Tashqi JSON yo'q, atayin shunday.
# ---------------------------------------------------------------------------

SUBJECTS = [
    {
        'id': 'matematika',
        'name': 'Matematika',
        'short': 'MAT',
        'icon': 'Calculator',
        'color': '#6366f1',
        'order': 1,
    },
    {
        'id': 'ona-tili',
        'name': 'Ona tili',
        'short': 'OT',
        'icon': 'BookText',
        'color': '#0ea5e9',
        'order': 2,
    },
    {
        'id': 'adabiyot',
        'name': 'Adabiyot',
        'short': 'ADB',
        'icon': 'Feather',
        'color': '#ec4899',
        'order': 3,
    },
    {
        'id': 'tarix',
        'name': 'Tarix',
        'short': 'TRX',
        'icon': 'Landmark',
        'color': '#f59e0b',
        'order': 4,
    },
]


# Helper qisqartmalar uchun ma'lumotlar strukturasi:
# Har bir mavzu: subject_id, grade, slug, title, summary, youtube,
# flashcards: [(front, back), ...], tests: [(question_text, [opts], correct_idx), ...]


def _fc(pairs_str: str) -> list[tuple[str, str]]:
    """' | ' bilan ajratilgan 'savol → javob' juftliklarini parsing qiladi."""
    pairs: list[tuple[str, str]] = []
    for chunk in pairs_str.split(' | '):
        chunk = chunk.strip()
        if not chunk:
            continue
        if '→' in chunk:
            front, back = chunk.split('→', 1)
        else:
            front, back = chunk.split('->', 1)
        pairs.append((front.strip().rstrip('?') + '?', back.strip()))
    return pairs


# --- MATEMATIKA 6-SINF · KASRLAR -------------------------------------------
M6_KASR_FC = [
    ('Kasr nima?', 'Butunning bir qismini bildiruvchi son.'),
    ('Kasr nechta qismdan iborat?', '2 qismdan: surat va maxraj.'),
    ('Kasrning yuqori qismi nima deyiladi?', 'Surat.'),
    ('Kasrning pastki qismi nima deyiladi?', 'Maxraj.'),
    ('Maxraj nimani bildiradi?', 'Butun nechta teng qismga boʻlinganini.'),
    ('Surat nimani bildiradi?', 'Nechta qism olinganini.'),
    ('3/5 kasrida surat nechchi?', '3.'),
    ('3/5 kasrida maxraj nechchi?', '5.'),
    ('1/2 nimani anglatadi?', 'Butunning teng ikkidan bir qismini.'),
    ('2/4 kasrida nechta qism olingan?', '2 ta qism.'),
    ('2/4 kasrida butun nechta qismga boʻlingan?', '4 qismga.'),
    ('Qaysi katta: 1/3 yoki 2/3?', '2/3 katta.'),
    ('Qaysi katta: 3/4 yoki 1/4?', '3/4 katta.'),
    ('Maxrajlari teng kasrlarni qanday solishtiramiz?', 'Surati katta boʻlgan kasr katta boʻladi.'),
    ('4/4 nimaga teng?', '1 butunga.'),
    ('1/4 + 1/4 nechiga teng?', '2/4 yoki 1/2.'),
    ('3/5 − 1/5 nechiga teng?', '2/5.'),
    ('Kasrlar hayotda qayerda ishlatiladi?', 'Ovqat ulashish, vaqt, uzunlik va oʻlchovlarda.'),
    ('Pitsaning yarmi qanday kasr bilan yoziladi?', '1/2.'),
    ('1 butun nechta 1/4 dan iborat?', '4 ta 1/4 dan.'),
]

M6_KASR_TESTS = [
    ('Kasr nima?', ['Butun son', 'Boʻlingan sonning qismi', 'Faqat katta son', 'Juft son'], 1),
    ('3/5 kasrida surat nechchi?', ['5', '2', '3', '8'], 2),
    ('3/5 kasrida maxraj nechchi?', ['3', '5', '15', '2'], 1),
    ('Maxraj nimani bildiradi?', ['Olingan qismni', 'Sonning kattaligini', 'Butun nechta qismga boʻlinganini', 'Kasr turini'], 2),
    ('1/2 nimani bildiradi?', ['Ikki butun', 'Yarim', 'Toʻrtdan bir', 'Uchdan bir'], 1),
    ('Qaysi kasr katta?', ['1/4', '2/4', 'Teng', 'Aniqlab boʻlmaydi'], 1),
    ('2/5 kasrida nechta qism olingan?', ['5', '2', '7', '10'], 1),
    ('4/4 nechiga teng?', ['0', '2', '1', '4'], 2),
    ('1/4+1/4 nechiga teng?', ['1/8', '2/8', '2/4', '3/4'], 2),
    ('3/5−1/5 nechiga teng?', ['4/5', '2/5', '1/5', '3/10'], 1),
    ('Qaysi kasr kichik?', ['3/4', '1/4', '4/4', '2/4'], 1),
    ('Kasrning yuqori qismi nima deyiladi?', ['Maxraj', 'Surat', 'Qoldiq', 'Boʻluvchi'], 1),
    ('Kasrning pastki qismi nima deyiladi?', ['Surat', 'Maxraj', 'Yigʻindi', 'Ayirma'], 1),
    ('1 butun nechta 1/4 dan iborat?', ['2', '3', '4', '5'], 2),
    ('Kasrlar qayerda ishlatiladi?', ['Faqat maktabda', 'Faqat matematikada', 'Hayotdagi oʻlchovlarda', 'Hech qayerda'], 2),
]


# --- MATEMATIKA 6-SINF · NATURAL SONLAR USTIDA AMALLAR ---------------------
M6_NATURAL_FC = [
    ('Natural sonlar qaysilar?', '1, 2, 3, 4, ...'),
    ('Eng kichik natural son qaysi?', '1.'),
    ('Qoʻshish amali belgisi qanday?', '+'),
    ('Ayirish amali belgisi qanday?', '−'),
    ('Koʻpaytirish amali belgisi qanday?', '×'),
    ('Boʻlish amali belgisi qanday?', '÷'),
    ('15 + 7 nechiga teng?', '22.'),
    ('20 − 8 nechiga teng?', '12.'),
    ('6 × 4 nechiga teng?', '24.'),
    ('36 ÷ 6 nechiga teng?', '6.'),
    ('Qaysi amal tezroq bajariladi: qoʻshishmi yoki koʻpaytirishmi?', 'Koʻpaytirish.'),
    ('2 + 5 × 3 nechiga teng?', '17.'),
    ('Nima uchun 2+5×3=17?', 'Avval koʻpaytirish bajariladi.'),
    ('(2+5)×3 nechiga teng?', '21.'),
    ('Qavs nima uchun ishlatiladi?', 'Amal tartibini oʻzgartirish uchun.'),
    ('45 ÷ 5 nechiga teng?', '9.'),
    ('9 × 8 nechiga teng?', '72.'),
    ('100 − 37 nechiga teng?', '63.'),
    ('7+8+3 nechiga teng?', '18.'),
    ('50÷10+2 nechiga teng?', '7.'),
]

M6_NATURAL_TESTS = [
    ('Natural sonlar qaysilar?', ['-1, -2', '1, 2, 3', '0, -1', 'Faqat juft'], 1),
    ('Qoʻshish belgisi?', ['−', '×', '+', '÷'], 2),
    ('15+8 nechiga teng?', ['21', '22', '23', '24'], 2),
    ('30−12 nechiga teng?', ['18', '20', '16', '14'], 0),
    ('6×7 nechiga teng?', ['36', '40', '42', '48'], 2),
    ('48÷6 nechiga teng?', ['6', '7', '8', '9'], 2),
    ('Koʻpaytirish belgisi?', ['+', '−', '×', '÷'], 2),
    ('Boʻlish belgisi?', ['÷', '+', '−', '×'], 0),
    ('2+3×4 nechiga teng?', ['20', '14', '24', '9'], 1),
    ('Nega 2+3×4=14?', ['Avval qoʻshish', 'Avval ayirish', 'Avval boʻlish', 'Avval koʻpaytirish'], 3),
    ('(2+3)×4 nechiga teng?', ['20', '14', '12', '9'], 0),
    ('Qavs uchun?', ['Kattalashtirish', 'Tartibni oʻzgartirish', 'Bezak', 'Ayirish'], 1),
    ('100−45 nechiga teng?', ['45', '50', '55', '65'], 2),
    ('9×9 nechiga teng?', ['72', '81', '99', '91'], 1),
    ('60÷10+2 nechiga teng?', ['6', '7', '8', '12'], 2),
]


# --- MATEMATIKA 7-SINF · MANFIY SONLAR -------------------------------------
M7_MANFIY_FC = [
    ('Manfiy son nima?', '0 dan kichik son.'),
    ('-7 qanday son?', 'Manfiy son.'),
    ('0 musbatmi yoki manfiymi?', 'Hech qaysisi emas.'),
    ('Sonlar oʻqida manfiy sonlar qayerda?', '0 ning chap tomonida.'),
    ('Qaysi katta: -2 yoki -5?', '-2 katta.'),
    ('Qaysi kichik: -1 yoki -8?', '-8 kichik.'),
    ('-3 dan keyin qaysi son?', '-2.'),
    ('-6 dan oldin qaysi son?', '-7.'),
    ('Harorat -10°C nimani bildiradi?', '0 dan 10 daraja sovuq.'),
    ('Qarzdorlikni koʻrsatishda qaysi sonlar?', 'Manfiy sonlar.'),
    ('-4+4 nechiga teng?', '0.'),
    ('Qarama-qarshi sonlar nima?', 'Bir-biridan faqat ishorasi bilan farq qiladigan sonlar.'),
    ('5 ning qarama-qarshi soni?', '-5.'),
    ('-9 ning qarama-qarshi soni?', '9.'),
    ('Musbat sonlar qayerda?', '0 ning oʻng tomonida.'),
    ('-1 va 1 qanday sonlar?', 'Qarama-qarshi sonlar.'),
    ('Qaysi katta: 0 yoki -3?', '0 katta.'),
    ('-12 sonining moduli?', '12.'),
    ('Modul nima?', 'Sonning 0 dan uzoqligi.'),
    ('|-7| nechiga teng?', '7.'),
]

M7_MANFIY_TESTS = [
    ('Manfiy son nima?', ['0 dan katta', '0 dan kichik', 'Juft', 'Toq'], 1),
    ('Qaysi son manfiy?', ['5', '0', '-3', '8'], 2),
    ('0 qanday son?', ['Musbat', 'Manfiy', 'Hech qaysisi emas', 'Toq'], 2),
    ('Sonlar oʻqida manfiy sonlar qayerda?', ['Oʻngda', 'Chapda', 'Tepada', 'Pastda'], 1),
    ('Qaysi katta?', ['-7', '-2', 'Teng', 'Aniqlab boʻlmaydi'], 1),
    ('Qaysi kichik?', ['-1', '-8', '0', '3'], 1),
    ('-4+4 nechiga teng?', ['8', '-8', '0', '4'], 2),
    ('5 ning qarama-qarshi soni?', ['5', '-5', '0', '10'], 1),
    ('-9 ning qarama-qarshi soni?', ['9', '-9', '0', '-18'], 0),
    ('Qaysi katta?', ['-5', '0', '-1', '-10'], 1),
    ('|-7| nechiga teng?', ['-7', '0', '7', '14'], 2),
    ('Modul nima?', ['Sonning belgisi', 'Sonning 0 dan uzoqligi', 'Sonning yarmi', 'Sonning kvadrati'], 1),
    ('Harorat -12°C nimani bildiradi?', ['Issiq', '0 dan 12 daraja past', '12 issiq', "Noma'lum"], 1),
    ('-3 dan keyin qaysi son?', ['-4', '-2', '0', '3'], 1),
    ('Musbat sonlar qayerda?', ['Chapda', 'Oʻngda', 'Oʻrtada', 'Pastda'], 1),
]


# --- MATEMATIKA 7-SINF · TENGLAMALAR ---------------------------------------
M7_TENG_FC = [
    ('Tenglama nima?', "Noma'lum son qatnashgan tenglik."),
    ("x+3=7 da noma'lum nima?", 'x.'),
    ('x+3=7 da x nechiga teng?', '4.'),
    ('x−5=9 da x nechiga teng?', '14.'),
    ('x×4=20 da x nechiga teng?', '5.'),
    ('x÷6=3 da x nechiga teng?', '18.'),
    ('Tenglama yechishdan maqsad?', "Noma'lum sonni topish."),
    ('x+8=15 da qanday amal?', '15 dan 8 ayiriladi.'),
    ('x−7=10 da qanday amal?', '10 ga 7 qoʻshiladi.'),
    ('x×5=35 da qanday amal?', '35 ni 5 ga boʻlinadi.'),
    ('x÷4=6 da qanday amal?', '6 ni 4 ga koʻpaytiriladi.'),
    ('2x=18 da x nechiga teng?', '9.'),
    ('x+12=20 da x nechiga teng?', '8.'),
    ('x−9=4 da x nechiga teng?', '13.'),
    ('x×7=56 da x nechiga teng?', '8.'),
    ('x÷9=2 da x nechiga teng?', '18.'),
    ('Tenglama yechimi nima?', "Tenglamani toʻgʻri qiladigan son."),
    ('Tekshirish qanday bajariladi?', 'Topilgan son tenglamaga qoʻyiladi.'),
    ('x+4=11 da tekshirish?', '7+4=11.'),
    ('3x=27 da x nechiga teng?', '9.'),
]

M7_TENG_TESTS = [
    ('Tenglama nima?', ['Oddiy son', "Noma'lum qatnashgan tenglik", 'Faqat qoʻshish', 'Jadval'], 1),
    ('x+5=11 da x?', ['5', '6', '11', '16'], 1),
    ('x−7=9 da x?', ['2', '16', '9', '7'], 1),
    ('x×4=24 da x?', ['4', '5', '6', '8'], 2),
    ('x÷5=7 da x?', ['12', '30', '35', '40'], 2),
    ('Tenglama yechish maqsadi?', ['Son yozish', "Noma'lumni topish", 'Qoʻshish', 'Jadval tuzish'], 1),
    ('x+9=15 da amal?', ['15+9', '15−9', '15×', '15÷'], 1),
    ('x−4=10 da amal?', ['10+4', '10−4', '10×', '10÷'], 0),
    ('x×6=42 da amal?', ['42+6', '42−6', '42÷6', '42×6'], 2),
    ('x÷3=8 da amal?', ['8×3', '8÷', '8−3', '8+3'], 0),
    ('2x=18 da x?', ['6', '7', '8', '9'], 3),
    ('3x=27 da x?', ['6', '7', '8', '9'], 3),
    ('x+12=20 da x?', ['6', '7', '8', '9'], 2),
    ('Tenglama yechimi?', ['Notoʻgʻri qiladigan son', 'Toʻgʻri qiladigan son', 'Faqat katta son', 'Musbat son'], 1),
    ('Tekshirish qanday?', ['Son oʻchiriladi', 'Qiymat tenglamaga qoʻyiladi', 'Koʻpaytiriladi', 'Boʻlinadi'], 1),
]


# --- ONA TILI 6-SINF · SO'Z VA UNING MA'NOSI -------------------------------
OT6_SOZ_FC = [
    ("Soʻz nima?", "Ma'no bildiruvchi tovush yoki harflar yigʻindisi."),
    ('Har bir soʻz nimani bildiradi?', "Ma'noni."),
    ('"Kitob" soʻzi nimani bildiradi?', 'Oʻqiladigan narsani.'),
    ('Soʻz nimadan tashkil topadi?', 'Harf va tovushlardan.'),
    ("Ma'nosiz tovushlar soʻz boʻla oladimi?", "Yoʻq."),
    ('"Ona" soʻzi qanday ma\'no bildiradi?', 'Insonni bildiradi.'),
    ('Soʻz yozuvda nimadan tashkil topadi?', 'Harflardan.'),
    ('Soʻz nutqda nimadan tashkil topadi?', 'Tovushlardan.'),
    ('"Olma" soʻzi nechta ma\'noda ishlatilishi mumkin?', "Bir nechta ma'noda."),
    ("Bir xil aytilib, boshqa ma'no bildiruvchi soʻzlar?", 'Omonimlar.'),
    ("Ma'nodosh soʻzlar nima deyiladi?", 'Sinonimlar.'),
    ("Qarama-qarshi ma'noli soʻzlar nima deyiladi?", 'Antonimlar.'),
    ('"Katta" soʻzining antonimi?', 'Kichik.'),
    ('"Chiroyli" soʻzining sinonimi?', "Goʻzal."),
    ('Soʻz nima uchun kerak?', 'Fikr bildirish uchun.'),
    ('Soʻzsiz gap tuzish mumkinmi?', 'Yoʻq.'),
    ('"Maktab" soʻzi nimani bildiradi?', "Ta'lim maskanini."),
    ('Soʻzlar yordamida nima hosil qilinadi?', 'Gap.'),
    ('"Yaxshi" qanday soʻz?', "Ma'no bildiruvchi soʻz."),
    ('Soʻzning asosiy vazifasi?', "Ma'no anglatish."),
]

OT6_SOZ_TESTS = [
    ('Soʻz nima?', ['Harf', 'Gap', "Ma'no bildiruvchi birlik", 'Tovush'], 2),
    ('Har bir soʻz nimani bildiradi?', ['Rang', "Ma'no", 'Son', 'Harakat'], 1),
    ('"Kitob" nimani bildiradi?', ['Hayvon', 'Oʻqiladigan narsa', 'Harakat', 'Belgi'], 1),
    ('Soʻz yozuvda nimadan?', ['Tovush', 'Gap', 'Harf', 'Belgi'], 2),
    ('Soʻz nutqda nimadan?', ['Harf', 'Tovush', 'Raqam', 'Boʻgʻin'], 1),
    ("Ma'nosiz tovush soʻz boʻladimi?", ['Ha', 'Yoʻq', "Ba'zan", 'Faqat yozuvda'], 1),
    ('Omonim nima?', ['Sinonim', 'Antonim', "Bir xil aytilib boshqa ma'no", "Fe'l"], 2),
    ('Sinonim nima?', ['Antonim', "Ma'nodosh", 'Omonim', 'Gap'], 1),
    ('Antonim nima?', ['Sinonim', 'Omonim', "Qarama-qarshi ma'no", 'Ot'], 2),
    ('"Katta" ning antonimi?', ['Ulkan', 'Kichik', 'Uzun', 'Baland'], 1),
    ('"Goʻzal" sinonimi?', ['Chiroyli', 'Xunuk', 'Sovuq', 'Tez'], 0),
    ('Soʻz nima uchun?', ['Rasm', 'Fikr bildirish', 'Sanash', 'Oʻyin'], 1),
    ('"Maktab" nimani bildiradi?', ['Oʻsimlik', 'Hayvon', "Ta'lim maskani", 'Sport'], 2),
    ('Soʻzlar yordamida nima hosil qilinadi?', ['Harf', 'Gap', 'Boʻgʻin', 'Tovush'], 1),
    ('Soʻzning vazifasi?', ["Ma'no anglatish", 'Chizish', 'Sanash', 'Kuylash'], 0),
]


# --- ONA TILI 6-SINF · GAP -------------------------------------------------
OT6_GAP_FC = [
    ('Gap nima?', 'Tugallangan fikr bildiruvchi soʻzlar yigʻindisi.'),
    ('Gap nima bildiradi?', 'Tugallangan fikrni.'),
    ('Gap nimadan tashkil topadi?', 'Soʻzlardan.'),
    ('"Men maktabga bordim." bu nima?', 'Gap.'),
    ('Gap oxiriga nima qoʻyiladi?', 'Nuqta, soʻroq yoki undov belgisi.'),
    ('Soʻroq gap oxiriga qaysi belgi?', 'Soʻroq belgisi (?).'),
    ('His-hayajon bildirgan gap?', 'Undov gap.'),
    ('Darak gap nima?', 'Xabar bildiruvchi gap.'),
    ('"Bugun havo issiq." qanday gap?', 'Darak gap.'),
    ('"Sen maktabga bordingmi?" qanday gap?', 'Soʻroq gap.'),
    ('"Voy, naqadar chiroyli!" qanday gap?', 'Undov gap.'),
    ('Gap bosh harf bilan yoziladimi?', 'Ha.'),
    ('Gapning vazifasi?', 'Fikrni ifodalash.'),
    ('Bitta soʻz gap boʻla oladimi?', 'Ha.'),
    ('"Keling!" gapmi?', 'Ha.'),
    ('Gapda soʻzlar qanday joylashadi?', "Ma'noli tartibda."),
    ('Gap nima bilan tugaydi?', 'Tinish belgisi bilan.'),
    ("Gap yozishda nimaga e'tibor?", 'Imlo va tinish belgilariga.'),
    ('Gap nima uchun kerak?', 'Fikr almashish uchun.'),
    ('Gapning eng muhim belgisi?', 'Tugallangan fikr bildirishi.'),
]

OT6_GAP_TESTS = [
    ('Gap nima?', ['Harf', 'Tugallangan fikr bildiruvchi soʻzlar yigʻindisi', 'Tovush', 'Boʻgʻin'], 1),
    ('Gap nima bildiradi?', ['Rang', 'Tugallangan fikr', 'Son', 'Harakat'], 1),
    ('Gap nimadan tashkil topadi?', ['Son', 'Harf', 'Soʻz', 'Belgi'], 2),
    ('"Men maktabga bordim." nima?', ['Soʻz', 'Gap', 'Harf', 'Boʻgʻin'], 1),
    ('Gap oxiriga nima qoʻyiladi?', ['Vergul', 'Tire', 'Tinish belgisi', 'Qoʻshtirnoq'], 2),
    ('Soʻroq gap belgisi?', ['Nuqta', 'Undov', 'Soʻroq belgisi', 'Vergul'], 2),
    ('His-hayajon bildiradigan gap?', ['Darak', 'Soʻroq', 'Undov', 'Sodda'], 2),
    ('"Bugun havo issiq." qanday?', ['Soʻroq', 'Undov', 'Darak', 'Buyruq'], 2),
    ('"Sen keldingmi?" qanday?', ['Darak', 'Soʻroq', 'Undov', 'Atov'], 1),
    ('"Voy, chiroyli!" qanday?', ['Soʻroq', 'Darak', 'Undov', 'Buyruq'], 2),
    ('Gap qanday harf bilan boshlanadi?', ['Kichik', 'Bosh', 'Raqam', 'Belgi'], 1),
    ('Gapning vazifasi?', ['Sanash', 'Fikr ifodalash', 'Chizish', 'Kuylash'], 1),
    ('Bitta soʻz gap boʻladimi?', ['Yoʻq', 'Ha', 'Faqat yozuvda', "Faqat she'rda"], 1),
    ('"Keling!" nima?', ['Soʻz', 'Gap', 'Boʻgʻin', 'Harf'], 1),
    ('Gapning eng muhim belgisi?', ['Uzunlik', 'Tugallangan fikr', 'Katta yozish', 'Chiroyli yozish'], 1),
]


# --- ONA TILI 7-SINF · SO'Z TURKUMLARI -------------------------------------
OT7_TURK_FC = [
    ('Soʻz turkumlari nima?', "Soʻzlarning ma'nosiga koʻra guruhlari."),
    ('Narsani bildiruvchi soʻzlar?', 'Ot.'),
    ('Belgini bildiruvchi soʻzlar?', 'Sifat.'),
    ('Harakatni bildiruvchi soʻzlar?', "Fe'l."),
    ('"Kitob" qaysi turkum?', 'Ot.'),
    ('"Chiroyli" qaysi turkum?', 'Sifat.'),
    ('"Yugurdi" qaysi turkum?', "Fe'l."),
    ('Sonni bildiruvchi soʻzlar?', 'Son.'),
    ('"Besh" qaysi turkum?', 'Son.'),
    ('Kishilikni bildiruvchi soʻzlar?', 'Olmosh.'),
    ('"Men" qaysi turkum?', 'Olmosh.'),
    ('Soʻz turkumlari nima uchun?', "Toʻgʻri ishlatish uchun."),
    ('Ot nimani bildiradi?', 'Narsa yoki shaxsni.'),
    ('Sifat nimani bildiradi?', 'Belgi va xususiyatni.'),
    ("Fe'l nimani bildiradi?", 'Harakatni.'),
    ('"Qizil olma" da sifat?', 'Qizil.'),
    ('"Bola yugurdi" da fe\'l?', 'Yugurdi.'),
    ('Soʻz turkumlari nechta guruhga?', 'Bir nechta.'),
    ('"Maktab" qaysi turkum?', 'Ot.'),
    ('Soʻz turkumlari qaysi boʻlimda?', 'Morfologiyada.'),
]

OT7_TURK_TESTS = [
    ('Soʻz turkumlari nima?', ['Gaplar', 'Soʻzlarning guruhlari', 'Harf', 'Belgi'], 1),
    ('Narsa bildiruvchi?', ["Fe'l", 'Sifat', 'Ot', 'Son'], 2),
    ('Belgi bildiruvchi?', ['Ot', "Fe'l", 'Sifat', 'Olmosh'], 2),
    ('Harakat bildiruvchi?', ['Son', "Fe'l", 'Sifat', 'Ot'], 1),
    ('"Kitob"?', ["Fe'l", 'Ot', 'Son', 'Olmosh'], 1),
    ('"Chiroyli"?', ['Sifat', "Fe'l", 'Son', 'Ot'], 0),
    ('"Yugurdi"?', ['Son', "Fe'l", 'Ot', 'Sifat'], 1),
    ('Son bildiruvchi?', ['Son', "Fe'l", 'Ot', 'Olmosh'], 0),
    ('"Besh"?', ["Fe'l", 'Ot', 'Son', 'Sifat'], 2),
    ('"Men"?', ['Son', "Fe'l", 'Olmosh', 'Ot'], 2),
    ('Ot?', ['Harakat', 'Belgi', 'Narsa/shaxs', 'Son'], 2),
    ('Sifat?', ['Harakat', 'Belgi', 'Son', 'Narsa'], 1),
    ("Fe'l?", ['Belgi', 'Harakat', 'Son', 'Shaxs'], 1),
    ('"Qizil olma" da sifat?', ['Olma', 'Qizil', 'Birikma', 'Yoʻq'], 1),
    ('Soʻz turkumlari qayerda oʻrganiladi?', ['Sintaksis', 'Morfologiya', 'Fonetika', 'Orfografiya'], 1),
]


# --- ONA TILI 7-SINF · GAP BO'LAKLARI --------------------------------------
OT7_BOLAK_FC = [
    ('Gap boʻlaklari nima?', 'Gapni tashkil qiluvchi qismlar.'),
    ('Gapning bosh boʻlaklari?', 'Ega va kesim.'),
    ('Ega nimani bildiradi?', 'Harakat egasini.'),
    ('Kesim nimani bildiradi?', 'Harakatni yoki holatni.'),
    ('"Bola kitob oʻqidi." da ega?', 'Bola.'),
    ('"Bola kitob oʻqidi." da kesim?', "Oʻqidi."),
    ('Toʻldiruvchi nima?', "Harakat bilan bogʻliq boʻlgan boʻlak."),
    ('Aniqlovchi?', 'Belgini aniqlaydi.'),
    ('Hol?', 'Harakatning holatini bildiradi.'),
    ('"Yaxshi bola keldi." da aniqlovchi?', 'Yaxshi.'),
    ('"Men maktabga bordim." da kesim?', 'Bordim.'),
    ('"Men maktabga bordim." da ega?', 'Men.'),
    ('Gap boʻlaklari nima uchun?', 'Gapni tahlil qilish uchun.'),
    ('Gapning asosiy mazmuni qaysi boʻlaklarda?', 'Ega va kesimda.'),
    ('"Qush uchdi." da ega?', 'Qush.'),
    ('"Qush uchdi." da kesim?', 'Uchdi.'),
    ('Egasiz gap boʻladimi?', 'Ha.'),
    ('Kesimsiz gap boʻladimi?', 'Yoʻq.'),
    ('Gap boʻlaklari qaysi boʻlimda?', 'Sintaksisda.'),
    ('Gap tahlilida avval nima topiladi?', 'Ega va kesim.'),
]

OT7_BOLAK_TESTS = [
    ('Gap boʻlaklari?', ['Harf', 'Gapni tashkil qiluvchi qismlar', 'Son', 'Belgi'], 1),
    ('Bosh boʻlaklar?', ['Hol va aniqlovchi', 'Ega va kesim', 'Toʻldiruvchi va hol', 'Aniqlovchi va ega'], 1),
    ('Ega?', ['Belgi', 'Harakat egasi', 'Son', 'Joy'], 1),
    ('Kesim?', ['Belgi', 'Harakat/holat', 'Son', 'Predmet'], 1),
    ('"Bola kitob oʻqidi." da ega?', ['Kitob', 'Oʻqidi', 'Bola', 'Gap'], 2),
    ('"Bola kitob oʻqidi." da kesim?', ['Bola', 'Kitob', 'Oʻqidi', 'Gap'], 2),
    ('Toʻldiruvchi?', ['Belgi', 'Harakat bilan bogʻliq', 'Gap oxiri', 'Harf'], 1),
    ('Aniqlovchi?', ['Belgini aniqlaydi', 'Son', 'Harakat', 'Tugatadi'], 0),
    ('Hol?', ['Belgi', 'Harakatning holati', 'Boshlaydi', 'Predmet'], 1),
    ('"Yaxshi bola keldi." da aniqlovchi?', ['Bola', 'Keldi', 'Yaxshi', 'Gap'], 2),
    ('"Men maktabga bordim." da ega?', ['Bordim', 'Maktabga', 'Men', 'Gap'], 2),
    ('"Men maktabga bordim." da kesim?', ['Men', 'Maktabga', 'Bordim', 'Gap'], 2),
    ('Gap boʻlaklari kerak?', ['Tahlil uchun', 'Rasm uchun', 'Son uchun', 'Oʻyin uchun'], 0),
    ('Gapning asosiy mazmuni qayerda?', ['Hol va aniqlovchi', 'Ega va kesim', 'Toʻldiruvchi', 'Undalmada'], 1),
    ('Gap boʻlaklari qaysi boʻlimda?', ['Morfologiya', 'Sintaksis', 'Fonetika', 'Leksikologiya'], 1),
]


# --- ADABIYOT 7-SINF · ADABIY ASARLAR --------------------------------------
ADB7_ASAR_FC = [
    (
        "Adabiy asarlar nima?",
        "She'r, hikoya, doston — yozuvchilar tomonidan yoziladigan yozma ijod.",
    ),
]


# --- ADABIYOT 7-SINF · QAHRAMON VA OBRAZ -----------------------------------
ADB7_OBRAZ_FC = [
    (
        "Qahramon va obraz nima?",
        "Asardagi ishtirokchilar va ularning xarakterini ochib beruvchi tasvirlar.",
    ),
]


# --- TARIX 6-SINF · QADIMGI TARIX IZLARIDAN --------------------------------
TRX6_IZLAR_FC = [
    ("Tarix nima?", "Oʻtmishda sodir boʻlgan voqealarni oʻrganadigan fan."),
    ("Tarixni oʻrganishda asosiy manba nima?", "Tarixiy manbalar."),
    ("Tarixiy manbalar necha turga boʻlinadi?", "Moddiy va yozma manbalarga."),
    ("Moddiy manbalarga nimalar kiradi?", "Qadimgi buyumlar, qurollar, binolar."),
    ("Yozma manbalarga nimalar kiradi?", "Kitoblar, bitiklar va hujjatlar."),
    ("Arxeologiya nimani oʻrganadi?", "Qadimgi odamlarning moddiy qoldiqlarini."),
    ("Arxeologlar nimani qazib topadilar?", "Qadimiy buyum va yodgorliklarni."),
    ("Antropologiya nimani oʻrganadi?", "Insonning kelib chiqishi va rivojlanishini."),
    ("Etnografiya nimani oʻrganadi?", "Xalqlarning urf-odat va turmushini."),
    ("Qadimgi odamlar haqida ma'lumot qayerdan olinadi?", "Qazilmalar va tarixiy manbalardan."),
    ("Eng qadimgi mehnat qurollari nimadan yasalgan?", "Toshdan."),
    ("Tarixiy davrlarni kimlar oʻrganadi?", "Tarixchilar."),
    ("Qadimgi yozuvlar nima uchun muhim?", "Oʻtmish haqida ma'lumot beradi."),
    ("Tarixiy yodgorlik nima?", "Oʻtmishdan saqlanib qolgan tarixiy obyekt."),
    ("Qadimgi shahar xarobalari nimaga kiradi?", "Moddiy manbaga."),
    ("\"Tarix\" soʻzi nimani anglatadi?", "Oʻtmish voqealari haqidagi hikoya."),
    ("Tarixni bilish nima uchun kerak?", "Oʻtmishni tushunish va xulosa chiqarish uchun."),
    ("Qadimgi davrlarni aniqlashda nima yordam beradi?", "Arxeologik topilmalar."),
    ("Tarixiy xaritalar nima uchun ishlatiladi?", "Qadimgi hududlarni koʻrsatish uchun."),
    ("Tarix fanining asosiy vazifasi nima?", "Insoniyat oʻtmishini oʻrganish."),
]


# --- TARIX 6-SINF · ENG QADIMGI ODAMLAR ------------------------------------
TRX6_ODAM_FC = [
    ("Eng qadimgi odamlar qayerda yashagan?", "Gʻor va ungurlarda."),
    ("Eng qadimgi odamlarning asosiy mashgʻuloti nima boʻlgan?", "Ovchilik va termachilik."),
    ("Termachilik nima?", "Tayyor oʻsimlik va mevalarni yigʻish."),
    ("Eng qadimgi odamlar qanday qurollardan foydalangan?", "Tosh qurollardan."),
    ("Paleolit davri nimani anglatadi?", "Qadimgi tosh davrini."),
    ("Mezolit davri nimani anglatadi?", "Oʻrta tosh davrini."),
    ("Neolit davri nimani anglatadi?", "Yangi tosh davrini."),
    ("Odamlar olovdan nima uchun foydalangan?", "Isinish va ovqat pishirish uchun."),
    ("Eng qadimgi odamlar qanday yashashgan?", "Toʻda boʻlib."),
    ("Kamon va oʻq qaysi davrda paydo boʻlgan?", "Mezolit davrida."),
    ("Neolit davrida qanday yangilik boʻlgan?", "Dehqonchilik va chorvachilik paydo boʻlgan."),
    ("Qadimgi odamlar kiyimni nimadan tayyorlagan?", "Hayvon terisidan."),
    ("\"Urugʻchilik jamoasi\" nima?", "Qarindosh kishilar guruhi."),
    ("Eng qadimgi san'at namunalariga nimalar kiradi?", "Gʻor rasmlari."),
    ("Qaysi davrda sopol idishlar paydo boʻlgan?", "Neolit davrida."),
    ("Eng qadimgi odamlar qanday ov qilgan?", "Jamoa boʻlib."),
    ("Qadimgi odamlarning asosiy boyligi nima boʻlgan?", "Mehnat qurollari."),
    ("Tosh davri necha bosqichga boʻlinadi?", "Paleolit, mezolit va neolitga."),
    ("Qadimgi odamlar tabiatga qanday bogʻliq boʻlgan?", "Juda kuchli bogʻliq boʻlgan."),
    ("Eng qadimgi odamlarning hayoti nimaga bogʻliq edi?", "Ov va tabiatga."),
]


# --- TARIX 6-SINF · QADIMGI TARIX IZLARIDAN — TESTS ------------------------
TRX6_IZLAR_TESTS = [
    ('Tarix nima?', ['Tabiatni oʻrganadigan fan', 'Oʻtmishni oʻrganadigan fan', 'Sonlarni oʻrganadigan fan', 'Tilni oʻrganadigan fan'], 1),
    ('Tarixiy manbalar necha turga boʻlinadi?', ['2 turga', '3 turga', '4 turga', '5 turga'], 0),
    ('Moddiy manbaga qaysi javob kiradi?', ['Kitob', 'Hujjat', 'Qadimgi qurol', 'Doston'], 2),
    ('Yozma manbaga nima kiradi?', ['Qal’a', 'Sopol idish', 'Kitob', 'Mehnat quroli'], 2),
    ('Arxeologiya nimani oʻrganadi?', ['Oʻsimliklarni', 'Qadimgi buyumlarni', 'Hayvonlarni', 'Sayyoralarni'], 1),
    ('Antropologiya nimani oʻrganadi?', ['Togʻlarni', 'Daryolarni', 'Inson kelib chiqishini', 'Yulduzlarni'], 2),
    ('Etnografiya nimani oʻrganadi?', ['Xalqlarning urf-odatlarini', 'Sonlarni', 'Togʻlarni', 'Qurollarni'], 0),
    ('Eng qadimgi qurollar nimadan yasalgan?', ['Temirdan', 'Misdan', 'Toshdan', 'Oltindan'], 2),
    ('Tarixiy yodgorlik nima?', ['Yangi bino', 'Oʻtmishdan qolgan obyekt', 'Kitob', 'Daryo'], 1),
    ('Tarixiy xaritalar nima uchun kerak?', ['Rasm chizish uchun', 'Hududlarni koʻrsatish uchun', 'Uy qurish uchun', 'Oʻyin uchun'], 1),
    ('Qadimgi yozuvlar nima uchun muhim?', ['Oʻtmish haqida ma’lumot beradi', 'Chiroyli koʻrinadi', 'Faqat bezak uchun', 'Oʻyin uchun'], 0),
    ('Tarixchilar kimlar?', ['Sportchilar', 'Oʻtmishni oʻrganuvchilar', 'Quruvchilar', 'Sayohatchilar'], 1),
    ('Tarix fanining asosiy vazifasi nima?', ['Hisoblash', 'Oʻtmishni oʻrganish', 'Chizmachilik', 'Qoʻshiq aytish'], 1),
    ('Qadimgi shahar xarobalari qanday manbaga kiradi?', ['Yozma manba', 'Moddiy manba', 'Ogʻzaki manba', 'Ilmiy manba'], 1),
    ('Tarixni bilish nima uchun kerak?', ['Oʻtmishdan xulosa chiqarish uchun', 'Faqat test uchun', 'Sport uchun', 'Sayr qilish uchun'], 0),
]


# --- TARIX 6-SINF · ENG QADIMGI ODAMLAR — TESTS ----------------------------
TRX6_ODAM_TESTS = [
    ('Eng qadimgi odamlar qayerda yashagan?', ['Saroylarda', 'Gʻorlarda', 'Qal’alarda', 'Shaharlarda'], 1),
    ('Qadimgi odamlarning asosiy mashgʻuloti?', ['Savdo', 'Hunarmandchilik', 'Ovchilik va termachilik', 'Dehqonchilik'], 2),
    ('Termachilik nima?', ['Ov qilish', 'Meva va oʻsimlik yigʻish', 'Uy qurish', 'Baliq ovlash'], 1),
    ('Paleolit qanday davr?', ['Yangi tosh davri', 'Oʻrta tosh davri', 'Qadimgi tosh davri', 'Temir davri'], 2),
    ('Mezolit qanday davr?', ['Oʻrta tosh davri', 'Mis davri', 'Temir davri', 'Bronza davri'], 0),
    ('Neolit qanday davr?', ['Mis davri', 'Yangi tosh davri', 'Temir davri', 'Bronza davri'], 1),
    ('Odamlar olovdan nima uchun foydalangan?', ['Oʻyin uchun', 'Isinish va ovqat pishirish uchun', 'Rasm chizish uchun', 'Uy qurish uchun'], 1),
    ('Kamon va oʻq qaysi davrda paydo boʻlgan?', ['Paleolit', 'Mezolit', 'Neolit', 'Temir davri'], 1),
    ('Neolit davrida qanday mashgʻulot paydo boʻlgan?', ['Ovchilik', 'Chorvachilik va dehqonchilik', 'Savdo', 'Dengizchilik'], 1),
    ('Qadimgi odamlar kiyimni nimadan tayyorlagan?', ['Paxtadan', 'Hayvon terisidan', 'Temirdan', 'Yogʻochdan'], 1),
    ('Urugʻchilik jamoasi nima?', ['Begona odamlar guruhi', 'Qarindosh kishilar guruhi', 'Ovchilar guruhi', 'Savdogarlar guruhi'], 1),
    ('Gʻor rasmlari nimaga kiradi?', ['San’at namunalariga', 'Qurollarga', 'Yozuvlarga', 'Xaritalarga'], 0),
    ('Tosh davri necha bosqichga boʻlinadi?', ['2', '3', '4', '5'], 1),
    ('Eng qadimgi odamlar qanday ov qilgan?', ['Yolgʻiz', 'Jamoa boʻlib', 'Ot bilan', 'Qayiqlarda'], 1),
    ('Qadimgi odamlar hayoti nimaga bogʻliq edi?', ['Savdoga', 'Tabiat va ovga', 'Hunarmandchilikka', 'Yozuvga'], 1),
]


# --- TARIX 7-SINF · O'RTA ASRLARGA KIRISH ----------------------------------
TRX7_ORTA_FC = [
    ("Oʻrta asrlar qaysi davr hisoblanadi?", "Qadimgi va yangi davr oraligʻi."),
    ("Yevropada oʻrta asrlar qachon boshlangan?", "Rim imperiyasi qulagandan soʻng."),
    ("Oʻrta asrlar necha bosqichga boʻlinadi?", "Ilk, rivojlangan va soʻnggi oʻrta asrlarga."),
    ("Ilk oʻrta asrlar qaysi asrlarni oʻz ichiga oladi?", "V–IX asrlarni."),
    ("Oʻrta asrlarda qaysi davlatlar mavjud boʻlgan?", "Turk xoqonligi, Eftaliylar va boshqalar."),
    ("\"Dehqon\" atamasi oʻrta asrlarda kimlarga nisbatan ishlatilgan?", "Yirik yer egalariga."),
    ("Kadivarlar kimlar boʻlgan?", "Yersiz ishlovchilar."),
    ("Oʻrta asrlarda asosiy mashgʻulot nima boʻlgan?", "Dehqonchilik."),
    ("Oʻrta asrlarda qaysi dinning ta'siri kuchaydi?", "Islom dini."),
    ("Arab xalifaligi qachon Movarounnahrga kirib kelgan?", "VIII asrda."),
    ("Oʻrta asrlarda qaysi buyuk allomalar yashagan?", "Beruniy, Ibn Sino, Fargʻoniy."),
    ("\"Movarounnahr\" nimani anglatadi?", "Ikki daryo oraligʻini."),
    ("Oʻrta asrlarda shaharlar nimaning markazi boʻlgan?", "Savdo va hunarmandchilikning."),
    ("Qishloq hokimlari qanday atalgan?", "Dehqonlar."),
    ("Oʻrta asrlarda qaysi til ilm-fan rivojida muhim boʻlgan?", "Arab tili."),
    ("Oʻrta asrlarda ilm-fan nima uchun rivojlandi?", "Madaniyat va savdo rivojlangani uchun."),
    ("Oʻrta asrlar tarixini nima uchun oʻrganamiz?", "Davlatlar va madaniyat rivojini bilish uchun."),
    ("\"Oʻrta Osiyo\" atamasi qachondan ishlatilgan?", "XVIII–XIX asrlardan."),
    ("Oʻrta asrlar davrida qanday yer egaligi kuchaydi?", "Feodal yer egaligi."),
    ("Oʻrta asrlarning asosiy belgilaridan biri nima?", "Davlatlar va madaniyatlarning rivojlanishi."),
]


# --- TARIX 7-SINF · IV–VII ASRLARDA XORAZM ---------------------------------
TRX7_XORAZM_FC = [
    ("Xorazm qaysi daryo boʻyida joylashgan?", "Amudaryo boʻyida."),
    ("Xorazmda asosiy mashgʻulot nima boʻlgan?", "Sugʻorma dehqonchilik."),
    ("Xorazmda qaysi sohalar rivojlangan?", "Hunarmandchilik va savdo."),
    ("Xorazmning qadimgi poytaxti qaysi?", "Tuproqqal'a."),
    ("Afrigʻiylar kimlar boʻlgan?", "Xorazm hukmdorlari sulolasi."),
    ("Afrigʻiylar qaysi asrlarda hukmronlik qilgan?", "III–X asrlarda."),
    ("Afrigʻ oʻz qarorgohini qayerga koʻchirgan?", "Kat shahriga."),
    ("Xorazmda qaysi din keng tarqalgan?", "Zardushtiylik."),
    ("Mobadlar kimlar boʻlgan?", "Zardushtiy ruhoniylar."),
    ("Xorazmda qanday binolar qurilgan?", "Qal'a va saroylar."),
    ("Xorazm savdo aloqalarini qaysi davlatlar bilan olib borgan?", "Eron va Xuroson bilan."),
    ("Xorazm aholisi yana nima bilan shugʻullangan?", "Chorvachilik va baliqchilik bilan."),
    ("Tuproqqal'a qayerda joylashgan?", "Qoraqalpogʻistonda."),
    ("Xorazmda qaysi san'at rivojlangan?", "Haykaltaroshlik va rassomchilik."),
    ("Xorazmda qanday yozuv ishlatilgan?", "Xorazm yozuvi."),
    ("Xorazmning hukmronlik ramzlari nimalar boʻlgan?", "Burgut va lochin."),
    ("Xorazmda suv nima uchun muhim boʻlgan?", "Dehqonchilik uchun."),
    ("Xorazmda qaysi qal'a mashhur boʻlgan?", "Tuproqqal'a."),
    ("Xorazmning rivojlanishiga nima yordam bergan?", "Sugʻorish tizimi va savdo."),
    ("IV–VII asrlarda Xorazm qanday davlat boʻlgan?", "Rivojlangan va kuchli davlat."),
]


# Mavzular roʻyxati: (subject_id, grade, slug, title, summary, youtube_url, flashcards, tests)
TOPICS: list[dict] = [
    {
        'subject_id': 'matematika',
        'grade': 6,
        'slug': 'kasrlar',
        'title': 'Kasrlar',
        'summary': '6-sinf · Kasrlar: surat, maxraj, taqqoslash va sodda amallar.',
        'youtube': 'https://youtu.be/0Nbnd8gFyXc',
        'order': 1,
        'flashcards': M6_KASR_FC,
        'tests': M6_KASR_TESTS,
    },
    {
        'subject_id': 'matematika',
        'grade': 6,
        'slug': 'natural-sonlar-amallar',
        'title': 'Natural sonlar ustida amallar',
        'summary': '6-sinf · Qoʻshish, ayirish, koʻpaytirish, boʻlish va amal tartibi.',
        'youtube': 'https://youtu.be/qNv7F90puL0',
        'order': 2,
        'flashcards': M6_NATURAL_FC,
        'tests': M6_NATURAL_TESTS,
    },
    {
        'subject_id': 'matematika',
        'grade': 7,
        'slug': 'manfiy-sonlar',
        'title': 'Manfiy sonlar',
        'summary': '7-sinf · Manfiy sonlar, modul, qarama-qarshi sonlar.',
        'youtube': 'https://youtu.be/I1d5kiXOjUg',
        'order': 3,
        'flashcards': M7_MANFIY_FC,
        'tests': M7_MANFIY_TESTS,
    },
    {
        'subject_id': 'matematika',
        'grade': 7,
        'slug': 'tenglamalar',
        'title': 'Tenglamalar',
        'summary': "7-sinf · Oddiy tenglamalarni yechish va tekshirish.",
        'youtube': 'https://youtu.be/GrGa5z6xHzU',
        'order': 4,
        'flashcards': M7_TENG_FC,
        'tests': M7_TENG_TESTS,
    },
    {
        'subject_id': 'ona-tili',
        'grade': 6,
        'slug': 'soz-va-uning-manosi',
        'title': "Soʻz va uning ma'nosi",
        'summary': "6-sinf · Soʻz, sinonim, antonim, omonim tushunchalari.",
        'youtube': '',
        'order': 1,
        'flashcards': OT6_SOZ_FC,
        'tests': OT6_SOZ_TESTS,
    },
    {
        'subject_id': 'ona-tili',
        'grade': 6,
        'slug': 'gap',
        'title': 'Gap',
        'summary': '6-sinf · Gap turlari: darak, soʻroq, undov.',
        'youtube': '',
        'order': 2,
        'flashcards': OT6_GAP_FC,
        'tests': OT6_GAP_TESTS,
    },
    {
        'subject_id': 'ona-tili',
        'grade': 7,
        'slug': 'soz-turkumlari',
        'title': 'Soʻz turkumlari',
        'summary': "7-sinf · Ot, sifat, son, fe'l, olmosh.",
        'youtube': '',
        'order': 3,
        'flashcards': OT7_TURK_FC,
        'tests': OT7_TURK_TESTS,
    },
    {
        'subject_id': 'ona-tili',
        'grade': 7,
        'slug': 'gap-bolaklari',
        'title': "Gap boʻlaklari",
        'summary': "7-sinf · Ega, kesim, aniqlovchi, toʻldiruvchi, hol.",
        'youtube': '',
        'order': 4,
        'flashcards': OT7_BOLAK_FC,
        'tests': OT7_BOLAK_TESTS,
    },
    # --- ADABIYOT (faqat flashcards, testlarsiz) ---------------------------
    {
        'subject_id': 'adabiyot',
        'grade': 7,
        'slug': 'adabiy-asarlar',
        'title': 'Adabiy asarlar',
        'summary': "She'r, hikoya, doston. Yozuvchilar tomonidan yoziladi. Qisqa: Yozma ijod.",
        'youtube': '',
        'order': 1,
        'flashcards': ADB7_ASAR_FC,
        'tests': [],
    },
    {
        'subject_id': 'adabiyot',
        'grade': 7,
        'slug': 'qahramon-va-obraz',
        'title': 'Qahramon va obraz',
        'summary': "Asardagi ishtirokchilar. Ularning xarakteri ochiladi. Qisqa: Obrazlar.",
        'youtube': '',
        'order': 2,
        'flashcards': ADB7_OBRAZ_FC,
        'tests': [],
    },
    # --- TARIX (faqat flashcards, testlarsiz) ------------------------------
    {
        'subject_id': 'tarix',
        'grade': 6,
        'slug': 'qadimgi-tarix-izlaridan',
        'title': 'Qadimgi tarix izlaridan',
        'summary': "6-sinf · Tarix fani, manbalar, arxeologiya va yodgorliklar.",
        'youtube': '',
        'order': 1,
        'flashcards': TRX6_IZLAR_FC,
        'tests': TRX6_IZLAR_TESTS,
    },
    {
        'subject_id': 'tarix',
        'grade': 6,
        'slug': 'eng-qadimgi-odamlar',
        'title': 'Eng qadimgi odamlar',
        'summary': "6-sinf · Tosh davri, ov, termachilik, dehqonchilik boshlanishi.",
        'youtube': '',
        'order': 2,
        'flashcards': TRX6_ODAM_FC,
        'tests': TRX6_ODAM_TESTS,
    },
    {
        'subject_id': 'tarix',
        'grade': 7,
        'slug': 'orta-asrlarga-kirish',
        'title': "Oʻrta asrlarga kirish",
        'summary': "7-sinf · Oʻrta asrlar davri, davlatlar, dehqonlar va madaniyat.",
        'youtube': '',
        'order': 3,
        'flashcards': TRX7_ORTA_FC,
        'tests': [],
    },
    {
        'subject_id': 'tarix',
        'grade': 7,
        'slug': 'iv-vii-asrlarda-xorazm',
        'title': "IV–VII asrlarda Xorazm",
        'summary': "7-sinf · Xorazm davlati, Afrigʻiylar sulolasi va madaniyati.",
        'youtube': '',
        'order': 4,
        'flashcards': TRX7_XORAZM_FC,
        'tests': [],
    },
]


class Command(BaseCommand):
    help = "Real ta'lim kontentini (Matematika, Ona tili — 6/7-sinf) seed qiladi."

    @transaction.atomic
    def handle(self, *args, **options):
        subjects_created = 0
        topics_created = 0
        lessons_created = 0
        flash_topics_created = 0
        flashcards_created = 0
        tests_created = 0
        questions_created = 0
        options_created = 0

        # 1) Subjects
        for s in SUBJECTS:
            obj, created = Subject.objects.update_or_create(
                id=s['id'],
                defaults={
                    'name': s['name'],
                    'short': s['short'],
                    'icon': s['icon'],
                    'color': s['color'],
                    'order': s['order'],
                    'is_active': True,
                },
            )
            subjects_created += 1
            self.stdout.write(f"  Subject: {obj.id} ({'NEW' if created else 'updated'})")

        # 2) Topics, Lessons, FlashTopics+Cards, Tests+Questions+Options
        for t in TOPICS:
            subject = Subject.objects.get(id=t['subject_id'])
            grade = t['grade']
            slug = t['slug']
            full_slug = f"{t['subject_id']}-{grade}-{slug}"  # global-unique id for slug-PK models

            # Topic
            topic_obj, _ = Topic.objects.update_or_create(
                subject=subject,
                slug=slug,
                defaults={
                    'name': t['title'],
                    'description': t['summary'],
                    'grade': grade,
                    'sort_order': t['order'] * 10,
                    'active': True,
                },
            )
            topics_created += 1

            # Lesson — YouTube link summary tarkibiga qoʻshiladi (model'da
            # alohida youtube_url field yoʻq). content[0] = video bloki.
            content_blocks = [{'type': 'text', 'value': t['summary']}]
            if t['youtube']:
                content_blocks.append({'type': 'video', 'url': t['youtube']})
            summary_with_grade = f"{grade}-sinf · {t['summary']}"
            if t['youtube']:
                summary_with_grade += f"\nVideo: {t['youtube']}"

            lesson_obj, _ = Lesson.objects.update_or_create(
                id=full_slug,
                defaults={
                    'subject': subject,
                    'title': f"{grade}-sinf · {t['title']}",
                    'duration_min': 15,
                    'level': Lesson.LEVEL_MID,
                    'summary': summary_with_grade,
                    'content': content_blocks,
                    'xp': 30,
                    'order': t['order'],
                    'is_active': True,
                },
            )
            lessons_created += 1

            # FlashTopic
            ft_obj, _ = FlashTopic.objects.update_or_create(
                id=full_slug,
                defaults={
                    'subject': subject,
                    'title': f"{grade}-sinf · {t['title']}",
                    'desc': t['summary'],
                    'order': t['order'],
                    'is_active': True,
                },
            )
            flash_topics_created += 1

            # Eski cards'ni tozalab, qaytadan yozamiz (idempotent)
            FlashCard.objects.filter(topic=ft_obj).delete()
            cards = [
                FlashCard(topic=ft_obj, front=front, back=back, order=i)
                for i, (front, back) in enumerate(t['flashcards'])
            ]
            FlashCard.objects.bulk_create(cards)
            flashcards_created += len(cards)

            # Test — faqat agar mavzu uchun savollar berilgan boʻlsa
            if t['tests']:
                test_obj, _ = Test.objects.update_or_create(
                    id=full_slug,
                    defaults={
                        'subject': subject,
                        'topic': topic_obj,
                        'title': f"{grade}-sinf · {t['title']} testi",
                        'difficulty': Test.DIFFICULTY_MID,
                        'duration_min': 15,
                        'xp': 60,
                        'order': t['order'],
                        'is_active': True,
                    },
                )
                tests_created += 1

                # Eski questions + options'ni tozalab, qaytadan yozamiz
                Question.objects.filter(test=test_obj).delete()
                for q_i, (q_text, opts, correct_idx) in enumerate(t['tests']):
                    q = Question.objects.create(
                        test=test_obj,
                        qtype=Question.TYPE_CHOICE,
                        text=q_text,
                        correct_index=correct_idx,
                        correct_text=opts[correct_idx],
                        explanation='',
                        grade=grade,
                        order=q_i,
                        points=10,
                    )
                    questions_created += 1
                    Option.objects.bulk_create([
                        Option(question=q, text=opt_text, order=o_i)
                        for o_i, opt_text in enumerate(opts)
                    ])
                    options_created += len(opts)

            self.stdout.write(
                f"  Topic: {full_slug} ({len(t['flashcards'])} cards, "
                f"{len(t['tests'])} questions)"
            )

        # Hisobotni chiqarib qoʻyamiz
        self.stdout.write(self.style.SUCCESS('\n=== SEED COMPLETE ==='))
        self.stdout.write(self.style.SUCCESS(f'  Subjects:    {subjects_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Topics:      {topics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Lessons:     {lessons_created}'))
        self.stdout.write(self.style.SUCCESS(f'  FlashTopics: {flash_topics_created}'))
        self.stdout.write(self.style.SUCCESS(f'  FlashCards:  {flashcards_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Tests:       {tests_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Questions:   {questions_created}'))
        self.stdout.write(self.style.SUCCESS(f'  Options:     {options_created}'))
