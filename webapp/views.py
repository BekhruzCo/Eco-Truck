import base64
import json
import random
import smtplib
from datetime import timedelta
from urllib import error as urllib_error
from urllib import request as urllib_request

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from reports.models import Report

from .forms import EmailAuthenticationForm
from .models import RegistrationRequest, UserProfile


PAGES = {
    "home": "index.html",
    "tracker": "tracker.html",
    "map": "map.html",
    "report": "report.html",
    "learn": "learn.html",
    "plant_doctor": "plant-doctor.html",
    "profile": "profile.html",
    "admin_panel": "admin.html",
}


def page(request: HttpRequest, name: str) -> HttpResponse:
    return render(request, PAGES[name])


def admin_only(view_func):
    return login_required(user_passes_test(lambda user: user.is_staff, login_url="/login/")(view_func))


@require_http_methods(["GET", "POST"])
def login_view(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        return redirect("/profile.html")

    form = EmailAuthenticationForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        login(request, form.get_user())
        messages.success(request, "Muvaffaqiyatli kirdingiz.")
        next_url = request.GET.get("next") or request.POST.get("next") or "/profile.html"
        return redirect(next_url)

    return render(request, "login.html", {"form": form, "next": request.GET.get("next", "")})


@require_GET
def register_view(request: HttpRequest) -> HttpResponse:
    return render(request, "register.html")


@login_required(login_url="/login/")
def profile_view(request: HttpRequest) -> HttpResponse:
    return render(request, "profile.html")


@admin_only
def admin_panel(request: HttpRequest) -> HttpResponse:
    return render(request, "admin.html")


def _parse_json(request: HttpRequest) -> dict:
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def _bad_request(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"error": message}, status=status)


def _send_verification_email(email: str, code: str) -> None:
    subject = "EcoTrack hisobingizni tasdiqlang"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ecotrack.local")
    text_body = (
        "EcoTrack platformasiga xush kelibsiz.\n\n"
        "Ro'yxatdan o'tishni yakunlash uchun quyidagi tasdiqlash kodini kiriting:\n\n"
        f"{code}\n\n"
        "Kod 10 daqiqa davomida amal qiladi.\n"
        "Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring."
    )
    html_body = f"""
    <html>
      <body style="margin:0;padding:24px;background:#f4f8ee;font-family:Segoe UI,Tahoma,sans-serif;color:#1d3127;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(125,170,42,0.14);border-radius:20px;overflow:hidden;">
          <div style="padding:20px 24px;background:linear-gradient(135deg,#a4d65e,#7fba34);color:#243114;">
            <div style="font-size:24px;font-weight:800;">EcoTrack</div>
            <div style="margin-top:6px;font-size:14px;">Hisobni tasdiqlash xabari</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;font-size:16px;">Salom,</p>
            <p style="margin:0 0 18px;line-height:1.7;">
              Ro'yxatdan o'tishni yakunlash uchun quyidagi tasdiqlash kodini kiriting:
            </p>
            <div style="margin:0 0 18px;padding:18px 20px;border-radius:16px;background:#f5fde8;border:1px solid rgba(127,186,52,0.24);text-align:center;">
              <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#466f18;">{code}</span>
            </div>
            <p style="margin:0 0 10px;line-height:1.7;">Kod 10 daqiqa davomida amal qiladi.</p>
            <p style="margin:0;color:#6f8479;line-height:1.7;">
              Agar bu so'rovni siz yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=[email],
        headers={
            "X-App-Name": "EcoTrack",
            "X-Auto-Response-Suppress": "All",
        },
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


@require_GET
def auth_status(request: HttpRequest) -> JsonResponse:
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})

    return JsonResponse(
        {
            "authenticated": True,
            "full_name": request.user.get_full_name() or request.user.username,
            "email": request.user.email,
            "username": request.user.username,
            "is_staff": request.user.is_staff,
        }
    )


@require_GET
@login_required(login_url="/login/")
def profile_data(request: HttpRequest) -> JsonResponse:
    user = request.user
    reports = Report.objects.filter(reporter=user)
    total_reports = reports.count()
    resolved_reports = reports.filter(status="resolved").count()
    points = total_reports * 30 + resolved_reports * 20
    eco_level = max(1, points // 150 + 1)
    progress = min(100, int((points % 150) / 150 * 100)) if points else 0

    leaderboard = (
        User.objects.filter(report__isnull=False)
        .distinct()
        .annotate(report_total=models.Count("report"))
        .order_by("-report_total", "username")
    )
    rank = next((index + 1 for index, item in enumerate(leaderboard) if item.pk == user.pk), None)

    month_labels = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun"]
    month_values = []
    now = timezone.now()
    for offset in range(5, -1, -1):
        current = now - timedelta(days=30 * offset)
        month_values.append(
            reports.filter(created_at__year=current.year, created_at__month=current.month).count()
        )

    badges = [
        {"icon": "1", "name": "Birinchi xabar", "earned": total_reports >= 1},
        {"icon": "5", "name": "5 ta xabar", "earned": total_reports >= 5},
        {"icon": "R", "name": "Hal qiluvchi", "earned": resolved_reports >= 3},
        {"icon": "10", "name": "10 ta xabar", "earned": total_reports >= 10},
        {"icon": "20", "name": "20 ta xabar", "earned": total_reports >= 20},
        {"icon": "E", "name": "Eko faoli", "earned": points >= 300},
    ]

    profile = getattr(user, "profile", None)
    return JsonResponse(
        {
            "full_name": user.first_name or user.username,
            "email": user.email,
            "username": user.username,
            "phone": profile.phone if profile and profile.phone else "Kiritilmagan",
            "registration_method": profile.registration_method if profile else "email",
            "points": points,
            "reports": total_reports,
            "resolved_reports": resolved_reports,
            "rank": rank or "-",
            "eco_level": eco_level,
            "progress_percent": progress,
            "next_level": eco_level + 1,
            "chart": [{"month": month_labels[index], "value": month_values[index]} for index in range(6)],
            "badges": badges,
            "is_staff": user.is_staff,
        }
    )


@require_http_methods(["GET", "POST"])
def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect("/")


def _call_plant_doctor_ai(image) -> dict[str, object]:
    if settings.GEMINI_API_KEY:
        return _call_plant_doctor_gemini(image)
    raise ValueError("GEMINI_API_KEY sozlanmagan.")


def _call_plant_doctor_gemini(image) -> dict[str, object]:
    content_type = image.content_type or "image/jpeg"
    if content_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise ValueError("Faqat JPG, PNG, WEBP yoki GIF rasm yuklang.")

    image_b64 = base64.b64encode(image.read()).decode("utf-8")
    payload = {
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "You are a plant pathologist assistant. Analyze the plant image and return JSON only. "
                        "Use Uzbek language. Identify the likely plant type, explain it briefly, determine whether "
                        "disease is visible, name the most likely disease or say no clear disease is visible, and "
                        "provide practical treatment and prevention advice. If uncertain, state uncertainty clearly."
                    )
                }
            ]
        },
        "contents": [
            {
                "parts": [
                    {"text": "Analyze this plant image and return the requested JSON."},
                    {
                        "inline_data": {
                            "mime_type": content_type,
                            "data": image_b64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "OBJECT",
                "properties": {
                    "plant": {"type": "STRING"},
                    "overview": {"type": "STRING"},
                    "disease": {"type": "STRING"},
                    "disease_present": {"type": "BOOLEAN"},
                    "confidence": {"type": "STRING"},
                    "urgency": {"type": "STRING"},
                    "treatment": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "prevention": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "note": {"type": "STRING"},
                },
                "required": [
                    "plant",
                    "overview",
                    "disease",
                    "disease_present",
                    "confidence",
                    "urgency",
                    "treatment",
                    "prevention",
                    "note",
                ],
            },
        },
    }

    request = urllib_request.Request(
        (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_VISION_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        ),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib_request.urlopen(request, timeout=90) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(details or f"Gemini API xatosi: {exc.code}") from exc
    except urllib_error.URLError as exc:
        raise RuntimeError("Gemini API bilan ulanishda xato yuz berdi.") from exc

    text_parts = []
    for candidate in raw.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                text_parts.append(part["text"])

    output_text = "\n".join(text_parts).strip()
    if not output_text:
        raise RuntimeError("Gemini javob qaytarmadi.")

    try:
        return json.loads(output_text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini javobini JSON ga aylantirib bo'lmadi.") from exc

@csrf_exempt
@require_POST
def start_registration(request: HttpRequest) -> JsonResponse:
    payload = _parse_json(request)
    full_name = payload.get("full_name", "").strip()
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    confirm_password = payload.get("confirm_password", "")
    email = payload.get("email", "").strip().lower()
    phone = payload.get("phone", "").strip()

    if len(full_name) < 3:
        return _bad_request("To'liq ism kamida 3 ta belgidan iborat bo'lishi kerak.")
    if len(username) < 3:
        return _bad_request("Username kamida 3 ta belgidan iborat bo'lishi kerak.")
    if User.objects.filter(username=username).exists():
        return _bad_request("Bu username allaqachon mavjud.")
    if not email or "@" not in email:
        return _bad_request("Email manzilni to'g'ri kiriting.")
    if User.objects.filter(email=email).exists():
        return _bad_request("Bu email allaqachon ro'yxatdan o'tgan.")
    if len(password) < 6:
        return _bad_request("Parol kamida 6 ta belgidan iborat bo'lishi kerak.")
    if password != confirm_password:
        return _bad_request("Parollar bir xil bo'lishi kerak.")
    if phone and UserProfile.objects.filter(phone=phone).exists():
        return _bad_request("Bu telefon raqam allaqachon ro'yxatdan o'tgan.")

    RegistrationRequest.objects.filter(
        email=email,
    ).delete()
    RegistrationRequest.objects.filter(username=username).delete()

    code = f"{random.randint(100000, 999999)}"
    registration = RegistrationRequest.objects.create(
        method="email",
        full_name=full_name,
        username=username,
        email=email,
        phone=phone,
        password_hash=make_password(password),
        verification_code=code,
        is_verified=False,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    try:
        _send_verification_email(email, code)
    except smtplib.SMTPException:
        registration.delete()
        return _bad_request("Emailga kod yuborilmadi. Email sozlamalarini qayta tekshiring.", 500)
    except OSError:
        registration.delete()
        return _bad_request("Email serverga ulanib bo'lmadi. Internet yoki SMTP sozlamani tekshiring.", 500)

    response = {
        "token": str(registration.token),
        "next_step": "verify",
        "message": "Ro'yxatdan o'tish davom etishi uchun emailingizga kod yuborildi.",
    }
    return JsonResponse(response, status=201)


@csrf_exempt
@require_POST
def analyze_plant(request: HttpRequest) -> JsonResponse:
    image = request.FILES.get("image")

    if not image:
        return _bad_request("Rasm yuklang.")

    try:
        analysis = _call_plant_doctor_ai(image)
    except ValueError as exc:
        return _bad_request(str(exc))
    except RuntimeError as exc:
        return _bad_request(str(exc), 500)

    return JsonResponse(analysis)


@csrf_exempt
@require_POST
def verify_email_code(request: HttpRequest) -> JsonResponse:
    payload = _parse_json(request)
    token = payload.get("token", "")
    code = payload.get("code", "").strip()

    try:
        registration = RegistrationRequest.objects.get(token=token, method="email")
    except RegistrationRequest.DoesNotExist:
        return _bad_request("Ro'yxatdan o'tish sessiyasi topilmadi.", 404)

    if registration.is_expired():
        registration.delete()
        return _bad_request("Kodning amal qilish muddati tugagan.")

    if registration.verification_code != code:
        return _bad_request("Siz noto'g'ri kod terdingiz.")

    registration.is_verified = True
    registration.save(update_fields=["is_verified"])

    user = User.objects.create_user(
        username=registration.username,
        password=None,
        first_name=registration.full_name,
        email=registration.email,
    )
    user.password = registration.password_hash
    user.save(update_fields=["password"])

    UserProfile.objects.create(
        user=user,
        phone=registration.phone or None,
        registration_method=registration.method,
    )

    login(request, user)
    registration.delete()
    return JsonResponse({"redirect_url": "/profile.html", "message": "Email tasdiqlandi. Hisob yaratildi."})


@csrf_exempt
@require_POST
def complete_registration(request: HttpRequest) -> JsonResponse:
    payload = _parse_json(request)
    token = payload.get("token", "")

    try:
        registration = RegistrationRequest.objects.get(token=token)
    except RegistrationRequest.DoesNotExist:
        return _bad_request("Ro'yxatdan o'tish sessiyasi topilmadi.", 404)

    if registration.is_expired():
        registration.delete()
        return _bad_request("Ro'yxatdan o'tish sessiyasi eskirgan.")
    if not registration.is_verified:
        return _bad_request("Avval emailni tasdiqlang.")
    if User.objects.filter(username=registration.username).exists():
        return _bad_request("Bu username allaqachon mavjud.")

    user = User.objects.create_user(
        username=registration.username,
        password=None,
        first_name=registration.full_name,
        email=registration.email,
    )
    user.password = registration.password_hash
    user.save(update_fields=["password"])

    UserProfile.objects.create(
        user=user,
        phone=registration.phone or None,
        registration_method=registration.method,
    )

    login(request, user)
    registration.delete()
    return JsonResponse({"redirect_url": "/profile.html", "message": "Ro'yxatdan o'tish yakunlandi."})
