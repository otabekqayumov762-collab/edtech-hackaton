from django.contrib import admin

from .models import (
    AiLearningSignal,
    AudioLesson,
    CoreAttempt,
    CoreProgress,
    CoreSubject,
    CoreTest,
    CoreTestQuestion,
    DailyPlan,
    GradeTrack,
    LearningUnit,
    PracticeGame,
    PracticeQuestion,
)


@admin.register(CoreSubject)
class CoreSubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_required', 'coming_soon', 'order')
    list_filter = ('is_required', 'coming_soon')
    search_fields = ('id', 'name')


@admin.register(GradeTrack)
class GradeTrackAdmin(admin.ModelAdmin):
    list_display = ('subject', 'grade', 'title', 'is_active')
    list_filter = ('subject', 'grade', 'is_active')
    search_fields = ('title',)


@admin.register(LearningUnit)
class LearningUnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'track', 'title', 'estimated_minutes', 'is_active')
    list_filter = ('track__subject', 'track__grade', 'is_active')
    search_fields = ('id', 'title')


@admin.register(AudioLesson)
class AudioLessonAdmin(admin.ModelAdmin):
    list_display = ('unit', 'title', 'xp_reward', 'coin_reward', 'gem_reward')


@admin.register(PracticeGame)
class PracticeGameAdmin(admin.ModelAdmin):
    list_display = ('unit', 'title', 'game_type', 'xp_per_correct', 'is_required')


@admin.register(PracticeQuestion)
class PracticeQuestionAdmin(admin.ModelAdmin):
    list_display = ('practice', 'difficulty', 'order')
    list_filter = ('practice__unit__track__subject', 'difficulty')


@admin.register(CoreTest)
class CoreTestAdmin(admin.ModelAdmin):
    list_display = ('unit', 'title', 'question_limit', 'xp_per_correct', 'is_required')


@admin.register(CoreTestQuestion)
class CoreTestQuestionAdmin(admin.ModelAdmin):
    list_display = ('test', 'difficulty', 'order')
    list_filter = ('test__unit__track__subject', 'difficulty')


@admin.register(CoreProgress)
class CoreProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'unit', 'audio_completed', 'practice_completed', 'test_completed')
    list_filter = ('audio_completed', 'practice_completed', 'test_completed')
    search_fields = ('user__email', 'unit__id')


@admin.register(CoreAttempt)
class CoreAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'unit', 'kind', 'correct', 'total', 'xp_earned', 'finished_at')
    list_filter = ('kind', 'unit__track__subject')
    search_fields = ('user__email', 'unit__id')


@admin.register(AiLearningSignal)
class AiLearningSignalAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'grade', 'source', 'is_correct', 'duration_seconds', 'created_at')
    list_filter = ('subject', 'grade', 'source', 'is_correct')
    search_fields = ('user__email', 'question_id')


@admin.register(DailyPlan)
class DailyPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'updated_at')
    search_fields = ('user__email',)
