"""Test Generator — sinfga (5-11) va fanga moslashuvchan test yaratuvchi.

Spec:
- Tarix / Ona tili+Adabiyot: 8-10 choice + 3-5 fill + 2-3 speech = ~15
- Matematika: 6-8 choice + 5-7 fill + 1-2 speech = ~15
- Har savol sinfga mos
- XP: choice=10, fill=15, speech=25
"""
from __future__ import annotations

import random
from typing import Dict, List

from django.db import transaction

from apps.subjects.models import Subject, Topic
from .models import Test, Question, Option


# Sample question bank — har subject × grade kombinatsiyasi uchun
# Real ma'lumotlar admin'dan yoki seed.py orqali to'ldiriladi.
QUESTION_BANK: Dict[str, Dict[int, Dict[str, List[dict]]]] = {
    'matematika': {
        5: {
            'choice': [
                {'q': '12 + 8 = ?', 'options': ['18', '20', '21', '22'], 'correct': 1, 'exp': '12+8 ni qo\'shamiz: 20.'},
                {'q': '25 ÷ 5 = ?', 'options': ['3', '4', '5', '6'], 'correct': 2, 'exp': '25 ni 5 ga bo\'lamiz: 5.'},
                {'q': '7 × 8 = ?', 'options': ['54', '56', '58', '60'], 'correct': 1, 'exp': '7×8=56.'},
                {'q': 'Qaysi son juft?', 'options': ['7', '9', '12', '15'], 'correct': 2, 'exp': '12 — 2 ga bo\'linadi.'},
            ],
            'fill': [
                {'q': '14 + 9 = ___', 'answer': '23', 'exp': '14+9=23.'},
                {'q': '36 ÷ 6 = ___', 'answer': '6', 'exp': ''},
                {'q': '9 × 4 = ___', 'answer': '36', 'exp': ''},
            ],
            'speech': [
                {'q': '15 sonini 3 ga ko\'paytirishni qanday tushuntirasiz?', 'answer': '15 ni 3 marta qo\'shamiz: 15+15+15=45.', 'exp': ''},
            ],
        },
        7: {
            'choice': [
                {'q': '5x + 3 = 13 → x = ?', 'options': ['1', '2', '3', '4'], 'correct': 1, 'exp': '5x=10, x=2.'},
                {'q': 'Uchburchak burchaklari yig\'indisi?', 'options': ['90°', '180°', '270°', '360°'], 'correct': 1, 'exp': 'Har doim 180°.'},
                {'q': '2x - 4 = 6 bo\'lsa, x = ?', 'options': ['3', '4', '5', '6'], 'correct': 2, 'exp': '2x=10, x=5.'},
            ],
            'fill': [
                {'q': '5x + 3 = 18 → x = ___', 'answer': '3', 'exp': '5x=15, x=3.'},
                {'q': 'Kvadrat perimetri formulasi: P = ___', 'answer': '4a', 'exp': '4 ta teng tomon.'},
                {'q': '3² + 4² = ___', 'answer': '25', 'exp': '9+16=25.'},
            ],
            'speech': [
                {'q': 'Tenglama nima va uni qanday yechasiz?', 'answer': 'Tenglama — noma\'lum sonni topish uchun yozilgan tenglik.', 'exp': ''},
            ],
        },
        9: {
            'choice': [
                {'q': 'x² - 9 = 0 → x = ?', 'options': ['±2', '±3', '±4', '±9'], 'correct': 1, 'exp': 'x²=9, x=±3.'},
                {'q': 'sin(30°) = ?', 'options': ['0', '0.5', '1', '√3/2'], 'correct': 1, 'exp': 'sin 30° = 0.5.'},
                {'q': 'log₁₀(100) = ?', 'options': ['1', '2', '10', '100'], 'correct': 1, 'exp': '10²=100.'},
            ],
            'fill': [
                {'q': 'x² - 5x + 6 = 0 → x = ___ va ___', 'answer': '2, 3', 'exp': 'Vieta: (x-2)(x-3)=0.'},
                {'q': 'sin(90°) = ___', 'answer': '1', 'exp': ''},
                {'q': '(a+b)² ni ochib yozing: ___', 'answer': 'a² + 2ab + b²', 'exp': 'Kvadrat yig\'indisi.'},
            ],
            'speech': [
                {'q': 'Kvadrat tenglama nima va uni qanday yechasiz?', 'answer': 'Diskriminant orqali yechiladi: D=b²-4ac.', 'exp': ''},
            ],
        },
    },
    'tarix': {
        5: {
            'choice': [
                {'q': 'O\'zbekiston poytaxti?', 'options': ['Samarqand', 'Toshkent', 'Buxoro', 'Andijon'], 'correct': 1, 'exp': 'Toshkent — O\'zbekiston poytaxti.'},
                {'q': 'Mustaqillik kuni qaysi sanada?', 'options': ['1 sentabr', '8 dekabr', '14 yanvar', '21 mart'], 'correct': 0, 'exp': '1 sentabr 1991.'},
            ],
            'fill': [
                {'q': 'Sohibqiron — ___', 'answer': 'Amir Temur', 'exp': ''},
                {'q': 'O\'zbekiston mustaqillik yili: ___', 'answer': '1991', 'exp': ''},
            ],
            'speech': [
                {'q': 'Vatan haqida o\'z fikringizni ayting.', 'answer': '', 'exp': 'Erkin javob.'},
            ],
        },
        9: {
            'choice': [
                {'q': 'Amir Temur saltanati barpo etilgan yil?', 'options': ['1336', '1370', '1395', '1402'], 'correct': 1, 'exp': '1370-yilda Samarqandda.'},
                {'q': 'Mirzo Ulug\'bek qachon tug\'ilgan?', 'options': ['1394', '1404', '1416', '1424'], 'correct': 0, 'exp': '1394-yilda.'},
                {'q': 'Toshkent Rossiya tomonidan bosib olingan yil?', 'options': ['1855', '1865', '1875', '1885'], 'correct': 1, 'exp': '1865-yil.'},
            ],
            'fill': [
                {'q': 'Bobur saltanati nomi: ___', 'answer': 'Boburiylar', 'exp': ''},
                {'q': 'Buxoro xonligi tashkil topgan yil: ___', 'answer': '1500', 'exp': ''},
                {'q': 'Ikkinchi jahon urushi tugash yili: ___', 'answer': '1945', 'exp': ''},
            ],
            'speech': [
                {'q': 'Amir Temur saltanatining ahamiyati nimada?', 'answer': '', 'exp': 'Erkin tushuntirish.'},
            ],
        },
        10: {
            'choice': [
                {'q': '«Tarix millatlarning o\'tmishi, taraqqiyoti hamda tanazzulining sabablarini o\'rganaturg\'on ilmdir» — fikr muallifi?', 'options': ['A.Avloniy', 'A.Fitrat', 'A.Cho\'lpon', 'A.Qodiriy'], 'correct': 1, 'exp': 'A.Fitratning ta\'rifi.'},
                {'q': 'Buxoro xonligi g\'arbdan qaysi hudud bilan chegaradosh hisoblangan?', 'options': ['Kaspiy', 'Xiva', 'Qo\'qon', 'Sirdaryo'], 'correct': 0, 'exp': 'G\'arbiy chegara — Kaspiy.'},
                {'q': 'Xiva xonligi janubdan qaysi hudud bilan chegaradosh hisoblangan?', 'options': ['Buxoro', 'Eron', 'Qozoq juzlari', 'Kaspiy'], 'correct': 1, 'exp': 'Janubdan — Eron.'},
                {'q': 'Qaysi davlat sersuv daryolar, so\'lim vodiylar, serhosil yerlarga boy bo\'lgan?', 'options': ['Buxoro', 'Xiva', 'Qo\'qon', 'Qozoq juzlari'], 'correct': 2, 'exp': 'Qo\'qon xonligi.'},
                {'q': 'Qo\'qon xonligida bosh vazir lavozimini bajargan amaldor nomi?', 'options': ['Qo\'shbegi', 'Mehtar', 'Otaliq', 'Mingboshi'], 'correct': 2, 'exp': 'Otaliq.'},
                {'q': '«Solg\'ut solig\'i» qaysi davlatda mavjud bo\'lgan?', 'options': ['Buxoro', 'Xiva', 'Qo\'qon', 'Qozoq juzlari'], 'correct': 3, 'exp': 'Qozoq juzlari.'},
                {'q': '«Agrar» so\'zi qaysi tildan olingan?', 'options': ['Yunon', 'Lotin', 'Ingliz', 'Nemis'], 'correct': 1, 'exp': 'Lotin tilidan — «yerga oid».'},
                {'q': 'O\'rta Osiyo madrasalarida bir yilda ta\'lim olish necha oy davom etgan?', 'options': ['6', '8', '9', '11'], 'correct': 3, 'exp': '11 oy.'},
                {'q': '1859-yilda Qo\'qon xonligini bosib olishni davom ettirish to\'g\'risidagi farmon qaysi rus imperatori nomi bilan bog\'liq?', 'options': ['Nikolay I', 'Aleksandr I', 'Nikolay II', 'Aleksandr II'], 'correct': 3, 'exp': 'Aleksandr II.'},
                {'q': 'Oqmasjid qal\'asi harbiy qo\'mondoni kim?', 'options': ['Aliquli', 'Musulmonqul', 'Yoqubbek', 'Abdumalik to\'ra'], 'correct': 0, 'exp': 'Aliquli.'},
            ],
            'fill': [
                {'q': '«O\'tkan kunlar» asari muallifi: ___', 'answer': 'Abdulla Qodiriy', 'exp': ''},
                {'q': 'Turkiston general gubernatorligi tashkil topgan yil: ___', 'answer': '1867', 'exp': ''},
                {'q': 'AQSH fuqarolar urushi yillari: ___', 'answer': '1861-1865', 'exp': ''},
                {'q': '«Tarixi Turkiston» asari muallifi: ___', 'answer': 'Mulla Olim Maxdum hoji', 'exp': ''},
                {'q': '1873-yilda Rossiyaning Buxorodagi birinchi vakili: ___', 'answer': 'Abramov', 'exp': ''},
            ],
            'speech': [
                {'q': 'O\'rta Osiyo xonliklarining XIX asrdagi siyosiy va iqtisodiy holatini tushuntirib bering.', 'answer': '', 'exp': 'Buxoro, Xiva, Qo\'qon xonliklarini taqqoslab javob bering.'},
                {'q': 'Rossiya imperiyasining O\'rta Osiyoga kirib kelishining sabablari va oqibatlarini ayting.', 'answer': '', 'exp': 'Iqtisodiy va siyosiy sabablar.'},
            ],
        },
    },
    'ona-tili-adabiyot': {
        5: {
            'choice': [
                {'q': 'Quyidagilardan qaysi biri ot?', 'options': ['Yugurmoq', 'Tez', 'Olma', 'Sariq'], 'correct': 2, 'exp': 'Olma — ot (predmet).'},
                {'q': 'Qaysi so\'z fe\'l?', 'options': ['Kitob', 'O\'qimoq', 'Yaxshi', 'Tor'], 'correct': 1, 'exp': 'O\'qimoq — harakat fe\'l.'},
            ],
            'fill': [
                {'q': '«Yugurmoq» so\'zining yasama shakli: ___', 'answer': 'yugurish', 'exp': ''},
                {'q': '«Olma»ning ko\'plik shakli: ___', 'answer': 'olmalar', 'exp': ''},
            ],
            'speech': [
                {'q': 'O\'zingiz haqingizda 3 ta gap tuzing.', 'answer': '', 'exp': ''},
            ],
        },
        9: {
            'choice': [
                {'q': '«Boburnoma»ni kim yozgan?', 'options': ['Alisher Navoiy', 'Bobur', 'Ulug\'bek', 'Mashrab'], 'correct': 1, 'exp': 'Zahiriddin Muhammad Bobur.'},
                {'q': 'Sifat nima?', 'options': ['Harakat', 'Predmet', 'Belgi', 'Son'], 'correct': 2, 'exp': 'Predmetning belgisi.'},
                {'q': 'Qaysi so\'z son?', 'options': ['Issiq', 'Birinchi', 'Yangi', 'Ko\'zalik'], 'correct': 1, 'exp': 'Birinchi — tartib son.'},
            ],
            'fill': [
                {'q': 'Mustaqil so\'zlar turkumi: ot, sifat, son, olmosh, ___', 'answer': 'fe\'l', 'exp': ''},
                {'q': '«Mehnat — baxt kaliti» — gap turi: ___', 'answer': 'maqol', 'exp': ''},
                {'q': '«O\'tkan kunlar» asari muallifi: ___', 'answer': 'Abdulla Qodiriy', 'exp': ''},
            ],
            'speech': [
                {'q': 'Alisher Navoiyning adabiyotdagi o\'rni haqida nima bilasiz?', 'answer': '', 'exp': ''},
            ],
        },
    },
}


def _nearest_grade(subject_key: str, grade: int) -> int:
    """Eng yaqin mavjud sinf darajasini topadi (5-6 / 7-8 / 9-11 bo'limlari)."""
    available = sorted((QUESTION_BANK.get(subject_key) or {}).keys())
    if not available:
        return grade
    if grade in available:
        return grade
    # 5-6 → 5, 7-8 → 7, 9-11 → 9
    if grade <= 6:
        return min(available, key=lambda g: abs(g - 5))
    if grade <= 8:
        return min(available, key=lambda g: abs(g - 7))
    return min(available, key=lambda g: abs(g - 9))


def _xp_for_type(qtype: str) -> int:
    return {'choice': 10, 'fill': 15, 'speech': 25}.get(qtype, 10)


@transaction.atomic
def generate_test(*, subject_slug: str, grade: int, topic_slug: str | None = None) -> Test:
    """Generate a 15-question adaptive test for given subject + grade.

    Returns the created Test (with Question + Option rows).
    """
    subject_key = subject_slug
    if subject_key not in QUESTION_BANK:
        # fallback aliases
        alias = {
            'ona_tili': 'ona-tili-adabiyot',
            'ona_tili_adabiyot': 'ona-tili-adabiyot',
        }
        subject_key = alias.get(subject_slug, subject_slug)

    bank = QUESTION_BANK.get(subject_key) or {}
    use_grade = _nearest_grade(subject_key, grade)
    pool = bank.get(use_grade) or {}

    # Sinfga moslab tip va son aralashtiriladi
    if subject_key == 'matematika':
        n_choice, n_fill, n_speech = 7, 6, 2
    else:
        n_choice, n_fill, n_speech = 9, 4, 2

    selected: List[tuple[str, dict]] = []
    for qt, count in (('choice', n_choice), ('fill', n_fill), ('speech', n_speech)):
        items = list(pool.get(qt, []))
        random.shuffle(items)
        # Agar yetarli bo'lmasa, mavjudini olamiz
        for it in items[:count]:
            selected.append((qt, it))
    random.shuffle(selected)

    subject = Subject.objects.filter(pk=subject_slug).first()
    topic = None
    if topic_slug and subject:
        topic = Topic.objects.filter(subject=subject, slug=topic_slug).first()

    slug = f'gen-{subject_slug}-{grade}-{random.randint(10000, 99999)}'
    test = Test.objects.create(
        id=slug,
        subject=subject,
        topic=topic,
        title=f'{subject_slug.capitalize()} — {grade}-sinf (avtomatik)',
        difficulty='mid',
        xp_reward=sum(_xp_for_type(t) for t, _ in selected),
    )

    for order, (qtype, payload) in enumerate(selected):
        q = Question.objects.create(
            test=test,
            qtype=qtype,
            text=payload['q'],
            grade=use_grade,
            order=order,
            points=_xp_for_type(qtype),
            explanation=payload.get('exp', ''),
            correct_text=payload.get('answer', ''),
            correct_index=payload.get('correct', 0),
        )
        if qtype == 'choice':
            for i, opt in enumerate(payload.get('options', [])):
                Option.objects.create(question=q, text=opt, order=i)

    return test
