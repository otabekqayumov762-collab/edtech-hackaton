"""User model — email login, gamification fields (lives, xp, streak)."""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Foydalanuvchi — email orqali kiradi."""

    GRADE_CHOICES = [
        ('9', '9-sinf'),
        ('10', '10-sinf'),
        ('11', '11-sinf'),
        ('abit', 'Abituriyent'),
        ('other', 'Boshqa'),
    ]
    PLAN_CHOICES = [
        ('free', 'Bepul'),
        ('premium', 'Premium'),
        ('premium_plus', 'Premium+'),
    ]
    PLACEMENT_LEVEL_CHOICES = [
        ('Boshlang‘ich', 'Boshlang‘ich'),
        ('O‘rta', 'O‘rta'),
        ('Yuqori', 'Yuqori'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    region = models.CharField(max_length=64, blank=True, default='')
    grade = models.CharField(max_length=10, choices=GRADE_CHOICES, default='11')
    avatar_color = models.CharField(max_length=9, default='#4F3CC9')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')

    # Gamification
    xp = models.PositiveIntegerField(default=0)
    streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    daily_goal = models.PositiveSmallIntegerField(default=5)
    daily_done = models.PositiveSmallIntegerField(default=0)
    daily_done_date = models.DateField(null=True, blank=True)
    daily_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    weak_subjects = models.JSONField(default=list, blank=True)
    placement_level = models.CharField(
        max_length=20,
        choices=PLACEMENT_LEVEL_CHOICES,
        null=True,
        blank=True,
    )

    lives = models.PositiveSmallIntegerField(default=10)
    lives_max = models.PositiveSmallIntegerField(default=10)
    lives_reset_date = models.DateField(null=True, blank=True)
    consecutive_correct = models.PositiveSmallIntegerField(default=0)

    # Valyuta — shop / boosterlar uchun (1 coin = 10 XP)
    coins = models.PositiveIntegerField(default=0)
    gems = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self) -> str:
        return f'{self.name} <{self.email}>'

    # ---------- gamification helpers ----------
    def touch_daily(self):
        today = timezone.localdate()
        if self.daily_done_date != today:
            self.daily_done = 0
            self.daily_done_date = today
        if self.lives_reset_date != today:
            if self.lives_reset_date is not None:
                self.lives = self.lives_max
            self.lives_reset_date = today

    def add_xp(self, amount: int) -> None:
        if amount > 0:
            self.xp += amount

    def lose_life(self) -> int:
        self.touch_daily()
        if self.lives > 0:
            self.lives -= 1
        self.consecutive_correct = 0
        self.save(
            update_fields=[
                'daily_done',
                'daily_done_date',
                'lives',
                'consecutive_correct',
                'lives_reset_date',
            ]
        )
        return self.lives

    def record_correct(self) -> bool:
        """Returns True if a life was awarded (5 ketma-ket)."""
        self.touch_daily()
        self.consecutive_correct += 1
        gained = False
        if self.consecutive_correct >= 5 and self.lives < self.lives_max:
            self.lives += 1
            self.consecutive_correct = 0
            gained = True
        self.save(
            update_fields=[
                'daily_done',
                'daily_done_date',
                'lives',
                'consecutive_correct',
                'lives_reset_date',
            ]
        )
        return gained
