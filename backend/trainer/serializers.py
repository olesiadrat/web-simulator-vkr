from rest_framework import serializers

from .models import BugReport, ReferenceBug, Scenario, Session


class ScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scenario
        fields = ["id", "title", "description", "json_structure", "created_at"]
        read_only_fields = ["id", "created_at"]


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "scenario", "start_time", "end_time"]
        read_only_fields = ["id", "start_time"]


class BugReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReport
        fields = [
            "id",
            "session",
            "description",
            "reproduction_steps",
            "expected",
            "actual",
            "ui_element",
            "check_status",
            "check_score",
            "check_summary",
            "check_strengths",
            "check_issues",
            "check_recommendation",
            "matched_reference_bug",
            "check_source",
            "checked_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "check_status",
            "check_score",
            "check_summary",
            "check_strengths",
            "check_issues",
            "check_recommendation",
            "matched_reference_bug",
            "check_source",
            "checked_at",
            "created_at",
        ]


class ReferenceBugSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferenceBug
        fields = ["id", "scenario", "description", "expected_behavior", "ui_element"]
        read_only_fields = ["id"]
