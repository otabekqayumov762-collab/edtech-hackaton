"""Core learning API smoke tests."""
from __future__ import annotations

import pytest


@pytest.mark.django_db
class TestCoreLearningCatalog:
    def test_required_subjects_and_grades_are_seeded(self, api_client):
        response = api_client.get('/api/v1/core/subjects/')

        assert response.status_code == 200
        ids = {row['id'] for row in response.json()}
        assert {'matematika', 'ona-tili-adabiyot', 'tarix'} <= ids

        grade = api_client.get('/api/v1/core/subjects/matematika/grades/5/')
        assert grade.status_code == 200
        body = grade.json()
        assert body['track']['grade'] == 5
        assert body['units']
        assert body['units'][0]['audio']
        assert body['units'][0]['practice']
        assert body['units'][0]['test']


@pytest.mark.django_db
class TestCoreLearningFlow:
    def test_audio_practice_test_daily_plan_flow(self, api_client, auth_client, user_factory):
        user = user_factory()
        user.lives = 10
        user.lives_max = 10
        user.save()
        client = auth_client(user)

        grade = api_client.get('/api/v1/core/subjects/matematika/grades/5/')
        unit_id = grade.json()['units'][0]['id']

        audio = client.post(
            '/api/v1/core/audio/complete/',
            {'unit_id': unit_id, 'duration_seconds': 120},
            format='json',
        )
        assert audio.status_code == 201
        assert {'xp', 'coins', 'gems', 'hearts_lost'} <= set(audio.json()['reward'])

        practice = api_client.get(f'/api/v1/core/practice/{unit_id}/')
        answers = [
            {'question_id': q['id'], 'picked_index': 0}
            for q in practice.json()['questions']
        ]
        practice_result = client.post(
            '/api/v1/core/practice/submit/',
            {'unit_id': unit_id, 'answers': answers, 'duration_seconds': 90},
            format='json',
        )
        assert practice_result.status_code == 201
        assert practice_result.json()['kind'] == 'practice'
        assert practice_result.json()['total'] == len(answers)

        user.refresh_from_db()
        user.lives = 10
        user.save(update_fields=['lives'])

        test = api_client.get(f'/api/v1/core/test/{unit_id}/')
        test_answers = [
            {'question_id': q['id'], 'picked_index': 0}
            for q in test.json()['questions']
        ]
        test_result = client.post(
            '/api/v1/core/test/submit/',
            {'unit_id': unit_id, 'answers': test_answers, 'duration_seconds': 110},
            format='json',
        )
        assert test_result.status_code == 201
        assert test_result.json()['kind'] == 'test'
        assert 'accuracy' in test_result.json()['payload']

        plan = client.get('/api/v1/core/daily-plan/')
        assert plan.status_code == 200
        assert plan.json()['tasks']
