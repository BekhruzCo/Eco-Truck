from django.contrib.auth.models import User
from django.db import models


class TrackerPoint(models.Model):
    TYPE_CHOICES = [
        ("trash", "Chiqindi"),
        ("water", "Suv iflosligi"),
        ("tree", "Daraxt"),
    ]
    STATUS_CHOICES = [
        ("active", "Faol"),
        ("completed", "Bajarilgan"),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=150)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    position_x = models.PositiveSmallIntegerField(default=50)
    position_y = models.PositiveSmallIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.title


class Report(models.Model):
    TYPE_CHOICES = TrackerPoint.TYPE_CHOICES
    STATUS_CHOICES = [
        ("pending", "Kutilmoqda"),
        ("in_progress", "Jarayonda"),
        ("resolved", "Hal qilindi"),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    location = models.CharField(max_length=255)
    description = models.TextField()
    image = models.FileField(upload_to="reports/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    reporter_name = models.CharField(max_length=150, blank=True)
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_type_display()} - {self.location}"


class BinLocation(models.Model):
    title = models.CharField(max_length=150, default="Chiqindi qutisi")
    description = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    image = models.FileField(upload_to="bins/images/", blank=True, null=True)
    video = models.FileField(upload_to="bins/videos/", blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.latitude}, {self.longitude})"
