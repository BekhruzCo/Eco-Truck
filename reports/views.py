import json

from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import BinLocation, Report, TrackerPoint


def admin_required(view_func):
    return login_required(user_passes_test(lambda user: user.is_staff, login_url="/login/")(view_func))


@require_GET
def tracker_points(request: HttpRequest) -> JsonResponse:
    data = [
        {
            "id": point.id,
            "type": point.type,
            "title": point.title,
            "description": point.description,
            "status": "Faol" if point.status == "active" else "Bajarilgan",
            "x": point.position_x,
            "y": point.position_y,
        }
        for point in TrackerPoint.objects.all()
    ]
    return JsonResponse({"results": data})


@require_GET
@admin_required
def report_list(request: HttpRequest) -> JsonResponse:
    data = [
        {
            "id": report.id,
            "type": report.type,
            "location": report.location,
            "description": report.description,
            "status": report.status,
            "date": report.created_at.date().isoformat(),
            "reporter": report.reporter_name or (report.reporter.username if report.reporter else "Anonim"),
            "image": report.image.url if report.image else "/static/assets/hero-bg.jpg",
        }
        for report in Report.objects.all()
    ]
    return JsonResponse({"results": data})


@csrf_exempt
@require_POST
def create_report(request: HttpRequest) -> JsonResponse:
    type_value = request.POST.get("type", "trash")
    location = request.POST.get("location", "").strip()
    description = request.POST.get("description", "").strip()

    if not location or not description:
        return JsonResponse({"error": "Location va description majburiy."}, status=400)

    report = Report.objects.create(
        type=type_value,
        location=location,
        description=description,
        image=request.FILES.get("image"),
        reporter=request.user if request.user.is_authenticated else None,
        reporter_name=request.user.get_full_name() or request.user.username if request.user.is_authenticated else "Mehmon",
    )
    return JsonResponse({"id": report.id, "message": "Report saqlandi."}, status=201)


@csrf_exempt
@require_POST
@admin_required
def update_report_status(request: HttpRequest, report_id: int) -> JsonResponse:
    try:
        report = Report.objects.get(pk=report_id)
    except Report.DoesNotExist:
        return JsonResponse({"error": "Report topilmadi."}, status=404)

    payload = json.loads(request.body.decode("utf-8") or "{}")
    status_value = payload.get("status", "resolved")
    if status_value not in {"pending", "in_progress", "resolved"}:
        return JsonResponse({"error": "Noto'g'ri status."}, status=400)

    report.status = status_value
    report.save(update_fields=["status"])
    return JsonResponse({"message": "Status yangilandi."})


@require_GET
def bin_locations(request: HttpRequest) -> JsonResponse:
    data = [
        {
            "id": location.id,
            "title": location.title,
            "description": location.description,
            "latitude": float(location.latitude),
            "longitude": float(location.longitude),
            "image": location.image.url if location.image else "",
            "video": location.video.url if location.video else "",
            "created_by": location.created_by.username if location.created_by else "Mehmon",
            "created_at": location.created_at.isoformat(),
        }
        for location in BinLocation.objects.all()
    ]
    return JsonResponse({"results": data})


@csrf_exempt
@require_POST
def create_bin_location(request: HttpRequest) -> JsonResponse:
    title = request.POST.get("title", "Chiqindi qutisi").strip() or "Chiqindi qutisi"
    description = request.POST.get("description", "").strip()
    latitude = request.POST.get("latitude", "").strip()
    longitude = request.POST.get("longitude", "").strip()

    if not latitude or not longitude:
        return JsonResponse({"error": "Lokatsiyani aniqlang."}, status=400)

    try:
        latitude_value = float(latitude)
        longitude_value = float(longitude)
    except ValueError:
        return JsonResponse({"error": "Lokatsiya qiymati noto'g'ri."}, status=400)

    if not (-90 <= latitude_value <= 90 and -180 <= longitude_value <= 180):
        return JsonResponse({"error": "Lokatsiya diapazoni noto'g'ri."}, status=400)

    bin_location = BinLocation.objects.create(
        title=title,
        description=description,
        latitude=latitude_value,
        longitude=longitude_value,
        image=request.FILES.get("image"),
        video=request.FILES.get("video"),
        created_by=request.user if request.user.is_authenticated else None,
    )

    return JsonResponse(
        {
            "id": bin_location.id,
            "message": "Chiqindi qutisi xaritaga qo'shildi.",
        },
        status=201,
    )
