from __future__ import annotations

from django.db import migrations


SUBJECTS = [
    ('matematika', 'Matematika', 'Mat', 'Calculator', '#2563eb', True, False, 1),
    ('ona-tili-adabiyot', 'Ona tili + Adabiyot', 'Til', 'BookOpenText', '#7c3aed', True, False, 2),
    ('tarix', 'Tarix', 'Tar', 'Landmark', '#0891b2', True, False, 3),
    ('ingliz-tili', 'Ingliz tili', 'Eng', 'Languages', '#16a34a', False, True, 10),
    ('fizika', 'Fizika', 'Fiz', 'Atom', '#ea580c', False, True, 11),
]


def questions(subject_id: str, grade: int):
    base = grade + 2
    if subject_id == 'matematika':
        return [
            (f'{grade} + {base} nechaga teng?', [grade + base - 1, grade + base, grade + base + 1, grade * base], 1, 'Qo‘shish amalida ikki son yig‘indisi olinadi.'),
            (f'{base} * 2 nechaga teng?', [base, base + 2, base * 2, base * 3], 2, 'Sonni 2 ga ko‘paytirish uning ikki baravari demak.'),
            (f'{grade * 3} - {grade} nechaga teng?', [grade, grade * 2, grade * 3, grade + 3], 1, 'Ayirishda kamayuvchi sondan ayiriluvchi ayriladi.'),
            ('Tenglamada x + 3 = 8 bo‘lsa, x nechaga teng?', [3, 4, 5, 6], 2, 'x = 8 - 3 = 5.'),
            ('1/2 va 2/4 qanday kasrlar?', ['Har xil', 'Teng', 'Manfiy', 'Butun'], 1, '2/4 qisqartirilsa 1/2 bo‘ladi.'),
        ]
    if subject_id == 'ona-tili-adabiyot':
        return [
            ('Qaysi so‘z ot turkumiga kiradi?', ['yugurdi', 'kitob', 'chiroyli', 'tez'], 1, 'Kitob predmet nomini bildiradi.'),
            ('Gapning bosh bo‘laklari qaysilar?', ['Aniqlovchi va hol', 'Ega va kesim', 'To‘ldiruvchi va undalma', 'Ravish va sifat'], 1, 'Ega va kesim gapning grammatik asosidir.'),
            ('Alisher Navoiy qaysi asari bilan mashhur?', ['Xamsa', 'O‘tkan kunlar', 'Kecha va kunduz', 'Shum bola'], 0, 'Navoiy "Xamsa" asari bilan mashhur.'),
            ('Sifat nimani bildiradi?', ['Ish-harakatni', 'Predmet belgisini', 'Son miqdorini', 'Joy nomini'], 1, 'Sifat predmetning belgisini bildiradi.'),
            ('Adabiyotda qahramon xarakteri nimada ko‘rinadi?', ['Faqat ismida', 'Nutqi va harakatida', 'Sahifa sonida', 'Muqova rangida'], 1, 'Obraz nutqi, harakati va munosabatlari orqali ochiladi.'),
        ]
    return [
        ('Amir Temur qaysi asrda yashagan?', ['XII asr', 'XIII-XIV asr', 'XIV-XV asr', 'XVI asr'], 2, 'Amir Temur 1336-1405-yillarda, XIV-XV asrlarda yashagan.'),
        ('Buyuk Ipak yo‘li nima edi?', ['Daryo', 'Savdo yo‘li', 'Qal’a', 'Kitob'], 1, 'Buyuk Ipak yo‘li Sharq va G‘arbni bog‘lagan savdo yo‘li edi.'),
        ('1991-yil 31-avgust qanday sana?', ['Konstitutsiya qabul qilingan', 'Mustaqillik e’lon qilingan', 'Poytaxt ko‘chgan', 'Saylov bo‘lgan'], 1, 'O‘zbekiston mustaqilligi 1991-yil 31-avgustda e’lon qilingan.'),
        ('Tarixiy manba nima?', ['O‘tmish haqida ma’lumot beruvchi dalil', 'Faqat roman', 'Sport musobaqasi', 'Matematik formula'], 0, 'Tarixiy manba o‘tmishni o‘rganishga yordam beradi.'),
        ('Arxeologiya nimani o‘rganadi?', ['Til qoidalarini', 'Qadimgi moddiy yodgorliklarni', 'Ob-havoni', 'Musiqani'], 1, 'Arxeologiya qadimgi buyum va yodgorliklar orqali tarixni o‘rganadi.'),
    ]


def seed(apps, schema_editor):
    CoreSubject = apps.get_model('core_learning', 'CoreSubject')
    GradeTrack = apps.get_model('core_learning', 'GradeTrack')
    LearningUnit = apps.get_model('core_learning', 'LearningUnit')
    AudioLesson = apps.get_model('core_learning', 'AudioLesson')
    PracticeGame = apps.get_model('core_learning', 'PracticeGame')
    PracticeQuestion = apps.get_model('core_learning', 'PracticeQuestion')
    CoreTest = apps.get_model('core_learning', 'CoreTest')
    CoreTestQuestion = apps.get_model('core_learning', 'CoreTestQuestion')

    for subject_id, name, short, icon, color, is_required, coming_soon, order in SUBJECTS:
        subject, _ = CoreSubject.objects.update_or_create(
            id=subject_id,
            defaults={
                'name': name,
                'short': short,
                'icon': icon,
                'color': color,
                'is_required': is_required,
                'coming_soon': coming_soon,
                'order': order,
            },
        )
        if coming_soon:
            continue

        for grade in range(5, 12):
            track, _ = GradeTrack.objects.update_or_create(
                subject=subject,
                grade=grade,
                defaults={
                    'title': f'{name} · {grade}-sinf',
                    'description': f'{grade}-sinf uchun majburiy {name} core yo‘li.',
                    'is_active': True,
                    'order': grade,
                },
            )
            unit_id = f'{subject_id}-{grade}-core'
            unit, _ = LearningUnit.objects.update_or_create(
                id=unit_id,
                defaults={
                    'track': track,
                    'title': f'{grade}-sinf start moduli',
                    'summary': 'Audio, majburiy mashq va testdan iborat game-style modul.',
                    'estimated_minutes': 20,
                    'order': 1,
                    'is_active': True,
                },
            )
            AudioLesson.objects.update_or_create(
                unit=unit,
                defaults={
                    'title': f'{name}: qisqa audio tushuntirish',
                    'audio_url': '',
                    'transcript': f'{name} bo‘yicha asosiy tushunchalarni tinglang va keyin mashqni bajaring.',
                    'duration_seconds': 240,
                    'xp_reward': 10,
                    'coin_reward': 1,
                    'gem_reward': 0,
                    'is_active': True,
                },
            )
            practice, _ = PracticeGame.objects.update_or_create(
                unit=unit,
                defaults={
                    'title': f'{name}: majburiy mashq',
                    'game_type': 'quiz',
                    'xp_per_correct': 8,
                    'coin_reward': 2,
                    'gem_reward_perfect': 1,
                    'is_required': True,
                    'is_active': True,
                },
            )
            test, _ = CoreTest.objects.update_or_create(
                unit=unit,
                defaults={
                    'title': f'{name}: 5 savollik test',
                    'question_limit': 5,
                    'xp_per_correct': 12,
                    'pass_bonus_xp': 20,
                    'perfect_bonus_xp': 40,
                    'coin_reward': 3,
                    'gem_reward_perfect': 2,
                    'is_required': True,
                    'is_active': True,
                },
            )
            for idx, (prompt, options, correct_idx, explanation) in enumerate(questions(subject_id, grade), start=1):
                PracticeQuestion.objects.update_or_create(
                    practice=practice,
                    order=idx,
                    defaults={
                        'prompt': prompt,
                        'question_type': 'quiz',
                        'options': options,
                        'correct_answer': {'index': correct_idx},
                        'explanation': explanation,
                        'difficulty': min(3, 1 + (idx // 3)),
                    },
                )
                CoreTestQuestion.objects.update_or_create(
                    test=test,
                    order=idx,
                    defaults={
                        'prompt': prompt,
                        'options': options,
                        'correct_index': correct_idx,
                        'explanation': explanation,
                        'difficulty': min(3, 1 + (idx // 3)),
                    },
                )


def unseed(apps, schema_editor):
    CoreSubject = apps.get_model('core_learning', 'CoreSubject')
    CoreSubject.objects.filter(id__in=[row[0] for row in SUBJECTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core_learning', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
