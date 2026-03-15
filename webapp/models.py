import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    REGISTRATION_METHODS = [
        ("email", "Email"),
        ("phone", "Phone"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=32, blank=True, unique=True, null=True)
    registration_method = models.CharField(max_length=16, choices=REGISTRATION_METHODS)
    created_at = models.DateTimeField(auto_now_add=True)

    daily_ai_limit = models.PositiveIntegerField(default=5)
    ai_used_today = models.PositiveIntegerField(default=0)
    ai_limit_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return self.user.username

    def refresh_ai_limit_if_needed(self) -> None:
        today = timezone.localdate()
        if self.ai_limit_date != today:
            self.ai_limit_date = today
            self.ai_used_today = 0
            self.save(update_fields=["ai_limit_date", "ai_used_today"])

    def remaining_ai_uses(self):
        if self.user.is_superuser:
            return None
        self.refresh_ai_limit_if_needed()
        return max(self.daily_ai_limit - self.ai_used_today, 0)

    def can_use_ai(self) -> bool:
        if self.user.is_superuser:
            return True
        return self.remaining_ai_uses() > 0

    def consume_ai_use(self) -> None:
        if self.user.is_superuser:
            return
        self.refresh_ai_limit_if_needed()
        self.ai_used_today += 1
        self.save(update_fields=["ai_used_today"])


class RegistrationRequest(models.Model):
    REGISTRATION_METHODS = UserProfile.REGISTRATION_METHODS

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    method = models.CharField(max_length=16, choices=REGISTRATION_METHODS)
    full_name = models.CharField(max_length=150, blank=True)
    username = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    password_hash = models.CharField(max_length=256)
    verification_code = models.CharField(max_length=6, blank=True)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self) -> str:
        return f"{self.method}:{self.email or self.phone}"
