"""App config for the CMS application."""
from django.apps import AppConfig


class CmsConfig(AppConfig):
    """Django ilova konfiguratsiyasi."""

    name = 'apps.cms'
    label = 'cms'
    default_auto_field = 'django.db.models.BigAutoField'
    verbose_name = 'Sayt mazmuni (CMS)'
