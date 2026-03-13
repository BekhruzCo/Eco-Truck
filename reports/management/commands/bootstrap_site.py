from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from reports.models import Report, TrackerPoint


class Command(BaseCommand):
    help = "Create default admin user and seed demo data."

    def handle(self, *args, **options):
        admin_user, created = User.objects.get_or_create(username="admin", defaults={"is_staff": True, "is_superuser": True})
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password("neo777")
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("Admin user ready: admin / neo777"))

        if not TrackerPoint.objects.exists():
            TrackerPoint.objects.bulk_create(
                [
                    TrackerPoint(type="trash", title="Chiqindi joyi", description="Ko'cha chetida plastik chiqindilar to'plangan", status="active", position_x=42, position_y=34),
                    TrackerPoint(type="water", title="Suv iflosligi", description="Daryoga chiqindi tashlanmoqda", status="active", position_x=58, position_y=48),
                    TrackerPoint(type="tree", title="Daraxt ekildi", description="50 ta yangi daraxt ekildi", status="completed", position_x=31, position_y=62),
                    TrackerPoint(type="trash", title="Tozalangan hudud", description="Hudud tozalandi va kuzatuvga olindi", status="completed", position_x=68, position_y=23),
                ]
            )

        if not Report.objects.exists():
            Report.objects.bulk_create(
                [
                    Report(type="trash", location="Toshkent, Chilonzor tumani", description="Ko'cha chetida katta axlat to'plangan", status="pending", reporter=admin_user, reporter_name="Admin"),
                    Report(type="water", location="Samarqand, Registon yonida", description="Kanalga chiqindilar tashlanmoqda", status="in_progress", reporter=admin_user, reporter_name="Admin"),
                    Report(type="tree", location="Buxoro, Markaziy park", description="Ruxsatsiz daraxtlar kesilmoqda", status="resolved", reporter=admin_user, reporter_name="Admin"),
                ]
            )

        self.stdout.write(self.style.SUCCESS("Demo tracker points and reports ready."))
