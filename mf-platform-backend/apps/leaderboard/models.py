"""No models, query-only app.

The :mod:`leaderboard` app owns no database tables of its own — it only
exposes read-only ranking endpoints that aggregate data from
:mod:`apps.users` (and, when available, :mod:`apps.gamification`).
"""
