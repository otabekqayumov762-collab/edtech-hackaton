"""Seed the mandatory core learning catalogue."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.core_learning.models import (
    AudioLesson,
    CoreSubject,
    CoreTest,
    CoreTestQuestion,
    GradeTrack,
    LearningUnit,
    PracticeGame,
    PracticeQuestion,
)


SUBJECTS = [
    {
        'id': 'matematika',
        'name': 'Matematika',
        'short': 'Mat',
        'icon': 'Calculator',
        'color': '#2563eb',
        'is_required': True,
        'coming_soon': False,
        'order': 1,
    },
    {
        'id': 'ona-tili-adabiyot',
        'name': 'Ona tili + Adabiyot',
        'short': 'Til',
        'icon': 'BookOpenText',
        'color': '#7c3aed',
        'is_required': True,
        'coming_soon': False,
        'order': 2,
    },
    {
        'id': 'tarix',
        'name': 'Tarix',
        'short': 'Tar',
        'icon': 'Landmark',
        'color': '#0891b2',
        'is_required': True,
        'coming_soon': False,
        'order': 3,
    },
    {
        'id': 'ingliz-tili',
        'name': 'Ingliz tili',
        'short': 'Eng',
        'icon': 'Languages',
        'color': '#16a34a',
        'is_required': False,
        'coming_soon': True,
        'order': 10,
    },
    {
        'id': 'fizika',
        'name': 'Fizika',
        'short': 'Fiz',
        'icon': 'Atom',
        'color': '#ea580c',
        'is_required': False,
        'coming_soon': True,
        'order': 11,
    },
]


def math_questions(grade: int):
    base = grade + 2
    return [
        (
            f'{grade} + {base} nechaga teng?',
            [grade + base - 1, grade + base, grade + base + 1, grade * base],
            1,
            'Qo‘shish amalida ikki son yig‘indisi olinadi.',
        ),
        (
            f'{base} * 2 nechaga teng?',
            [base, base + 2, base * 2, base * 3],
            2,
            'Sonni 2 ga ko‘paytirish uning ikki baravari demak.',
        ),
        (
            f'{grade * 3} - {grade} nechaga teng?',
            [grade, grade * 2, grade * 3, grade + 3],
            1,
            'Ayirishda kamayuvchi sondan ayiriluvchi ayriladi.',
        ),
        (
            'Tenglamada x + 3 = 8 bo‘lsa, x nechaga teng?',
            [3, 4, 5, 6],
            2,
            'x = 8 - 3 = 5.',
        ),
        (
            '1/2 va 2/4 qanday kasrlar?',
            ['Har xil', 'Teng', 'Manfiy', 'Butun'],
            1,
            '2/4 qisqartirilsa 1/2 bo‘ladi.',
        ),
    ]


def language_questions(_grade: int):
    return [
        (
            'Qaysi so‘z ot turkumiga kiradi?',
            ['yugurdi', 'kitob', 'chiroyli', 'tez'],
            1,
            'Kitob predmet nomini bildiradi.',
        ),
        (
            'Gapning bosh bo‘laklari qaysilar?',
            ['Aniqlovchi va hol', 'Ega va kesim', 'To‘ldiruvchi va undalma', 'Ravish va sifat'],
            1,
            'Ega va kesim gapning grammatik asosidir.',
        ),
        (
            'Alisher Navoiy qaysi asari bilan mashhur?',
            ['Xamsa', 'O‘tkan kunlar', 'Kecha va kunduz', 'Shum bola'],
            0,
            'Navoiy "Xamsa" asari bilan mashhur.',
        ),
        (
            'Sifat nimani bildiradi?',
            ['Ish-harakatni', 'Predmet belgisini', 'Son miqdorini', 'Joy nomini'],
            1,
            'Sifat predmetning belgisini bildiradi.',
        ),
        (
            'Adabiyotda qahramon xarakteri nimada ko‘rinadi?',
            ['Faqat ismida', 'Nutqi va harakatida', 'Sahifa sonida', 'Muqova rangida'],
            1,
            'Obraz nutqi, harakati va munosabatlari orqali ochiladi.',
        ),
    ]


def history_questions(_grade: int):
    return [
        (
            'Amir Temur qaysi asrda yashagan?',
            ['XII asr', 'XIII-XIV asr', 'XIV-XV asr', 'XVI asr'],
            2,
            'Amir Temur 1336-1405-yillarda, XIV-XV asrlarda yashagan.',
        ),
        (
            'Buyuk Ipak yo‘li nima edi?',
            ['Daryo', 'Savdo yo‘li', 'Qal’a', 'Kitob'],
            1,
            'Buyuk Ipak yo‘li Sharq va G‘arbni bog‘lagan savdo yo‘li edi.',
        ),
        (
            '1991-yil 31-avgust qanday sana?',
            ['Konstitutsiya qabul qilingan', 'Mustaqillik e’lon qilingan', 'Poytaxt ko‘chgan', 'Saylov bo‘lgan'],
            1,
            'O‘zbekiston mustaqilligi 1991-yil 31-avgustda e’lon qilingan.',
        ),
        (
            'Tarixiy manba nima?',
            ['O‘tmish haqida ma’lumot beruvchi dalil', 'Faqat roman', 'Sport musobaqasi', 'Matematik formula'],
            0,
            'Tarixiy manba o‘tmishni o‘rganishga yordam beradi.',
        ),
        (
            'Arxeologiya nimani o‘rganadi?',
            ['Til qoidalarini', 'Qadimgi moddiy yodgorliklarni', 'Ob-havoni', 'Musiqani'],
            1,
            'Arxeologiya qadimgi buyum va yodgorliklar orqali tarixni o‘rganadi.',
        ),
    ]


QUESTION_BUILDERS = {
    'matematika': math_questions,
    'ona-tili-adabiyot': language_questions,
    'tarix': history_questions,
}


class Command(BaseCommand):
    help = 'Seed core learning subjects, grades, units, audio, practice and tests.'

    def handle(self, *args, **options):
        created = 0

        for row in SUBJECTS:
            subject, was_created = CoreSubject.objects.update_or_create(
                id=row['id'],
                defaults=row,
            )
            created += int(was_created)
            if subject.coming_soon:
                continue

            for grade in range(5, 12):
                track, track_created = GradeTrack.objects.update_or_create(
                    subject=subject,
                    grade=grade,
                    defaults={
                        'title': f'{subject.name} · {grade}-sinf',
                        'description': f'{grade}-sinf uchun majburiy {subject.name} core yo‘li.',
                        'is_active': True,
                        'order': grade,
                    },
                )
                created += int(track_created)

                unit_id = f'{subject.id}-{grade}-core'
                unit, unit_created = LearningUnit.objects.update_or_create(
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
                created += int(unit_created)

                AudioLesson.objects.update_or_create(
                    unit=unit,
                    defaults={
                        'title': f'{subject.name}: qisqa audio tushuntirish',
                        'audio_url': '',
                        'transcript': f'{subject.name} bo‘yicha asosiy tushunchalarni tinglang va keyin mashqni bajaring.',
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
                        'title': f'{subject.name}: majburiy mashq',
                        'game_type': PracticeGame.TYPE_QUIZ,
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
                        'title': f'{subject.name}: 5 savollik test',
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

                builder = QUESTION_BUILDERS[subject.id]
                questions = builder(grade)
                for order, (prompt, options_list, correct_idx, explanation) in enumerate(questions, start=1):
                    PracticeQuestion.objects.update_or_create(
                        practice=practice,
                        order=order,
                        defaults={
                            'prompt': prompt,
                            'question_type': PracticeGame.TYPE_QUIZ,
                            'options': options_list,
                            'correct_answer': {'index': correct_idx},
                            'explanation': explanation,
                            'difficulty': min(3, 1 + (order // 3)),
                        },
                    )
                    CoreTestQuestion.objects.update_or_create(
                        test=test,
                        order=order,
                        defaults={
                            'prompt': prompt,
                            'options': options_list,
                            'correct_index': correct_idx,
                            'explanation': explanation,
                            'difficulty': min(3, 1 + (order // 3)),
                        },
                    )

        self.stdout.write(self.style.SUCCESS(f'Core learning seed complete. Created: {created}'))
