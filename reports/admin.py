from django.contrib import admin

from .models import BinLocation, Report, TrackerPoint


@admin.register(TrackerPoint)
class TrackerPointAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "status", "position_x", "position_y")
    list_filter = ("type", "status")
    search_fields = ("title", "description")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "location", "status", "reporter_name", "created_at")
    list_filter = ("type", "status")
    search_fields = ("location", "description", "reporter_name")


@admin.register(BinLocation)
class BinLocationAdmin(admin.ModelAdmin):
    list_display = ("title", "latitude", "longitude", "created_by", "created_at")
    search_fields = ("title", "description")
