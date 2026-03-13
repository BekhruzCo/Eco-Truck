from django.urls import path

from . import views


urlpatterns = [
    path("", views.page, {"name": "home"}, name="home"),
    path("map.html", views.page, {"name": "map"}, name="map"),
    path("tracker.html", views.page, {"name": "tracker"}, name="tracker"),
    path("report.html", views.page, {"name": "report"}, name="report"),
    path("learn.html", views.page, {"name": "learn"}, name="learn"),
    path("plant-doctor.html", views.page, {"name": "plant_doctor"}, name="plant-doctor"),
    path("profile.html", views.profile_view, name="profile"),
    path("admin.html", views.admin_panel, name="admin-panel"),
    path("login/", views.login_view, name="login"),
    path("auth/status/", views.auth_status, name="auth-status"),
    path("profile/data/", views.profile_data, name="profile-data"),
    path("register/", views.register_view, name="register"),
    path("register/start/", views.start_registration, name="register-start"),
    path("register/verify-email/", views.verify_email_code, name="register-verify-email"),
    path("register/complete/", views.complete_registration, name="register-complete"),
    path("plant-doctor/analyze/", views.analyze_plant, name="plant-doctor-analyze"),
    path("logout/", views.logout_view, name="logout"),
]
