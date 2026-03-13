from django.urls import path

from . import views


urlpatterns = [
    path("tracker-points/", views.tracker_points, name="tracker-points"),
    path("reports/", views.report_list, name="report-list"),
    path("reports/create/", views.create_report, name="report-create"),
    path("reports/<int:report_id>/status/", views.update_report_status, name="report-status"),
    path("bin-locations/", views.bin_locations, name="bin-locations"),
    path("bin-locations/create/", views.create_bin_location, name="bin-location-create"),
]
