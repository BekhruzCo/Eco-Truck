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

    def __str__(self) -> str:
        return self.user.username


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
