from django.contrib import admin

from .models import RegistrationRequest, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone",
        "registration_method",
        "daily_ai_limit",
        "ai_used_today",
        "ai_limit_date",
        "created_at",
    )
    list_filter = ("registration_method", "ai_limit_date", "created_at")
    search_fields = ("user__username", "user__email", "phone")
    list_editable = ("daily_ai_limit",)
    readonly_fields = ("ai_used_today", "ai_limit_date", "created_at")


@admin.register(RegistrationRequest)
class RegistrationRequestAdmin(admin.ModelAdmin):
    list_display = ("token", "method", "email", "phone", "is_verified", "expires_at", "created_at")
    list_filter = ("method", "is_verified")
    search_fields = ("email", "phone")
