from django.contrib import admin

from .models import BugReport, ReferenceBug, Scenario, Session


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "created_at"]
    search_fields = ["title", "description"]


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ["id", "scenario", "start_time", "end_time"]
    list_filter = ["scenario"]


@admin.register(BugReport)
class BugReportAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "ui_element", "created_at"]
    list_filter = ["session__scenario"]
    search_fields = ["description", "expected", "actual", "ui_element"]


@admin.register(ReferenceBug)
class ReferenceBugAdmin(admin.ModelAdmin):
    list_display = ["id", "scenario", "ui_element"]
    list_filter = ["scenario"]
    search_fields = ["description", "expected_behavior", "ui_element"]

