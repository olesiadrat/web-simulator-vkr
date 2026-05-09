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
    MUTABLE_BUG_FIELDS = {
        "description",
        "reproduction_steps",
        "expected",
        "actual",
        "ui_element",
    }

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

    def update(self, instance, validated_data):
        should_reset_check = any(
            field in validated_data and validated_data[field] != getattr(instance, field)
            for field in self.MUTABLE_BUG_FIELDS
        )

        instance = super().update(instance, validated_data)

        if should_reset_check:
            instance.check_status = ""
            instance.check_score = None
            instance.check_summary = ""
            instance.check_strengths = []
            instance.check_issues = []
            instance.check_recommendation = ""
            instance.matched_reference_bug = ""
            instance.check_source = ""
            instance.checked_at = None
            instance.save(
                update_fields=[
                    "check_status",
                    "check_score",
                    "check_summary",
                    "check_strengths",
                    "check_issues",
                    "check_recommendation",
                    "matched_reference_bug",
                    "check_source",
                    "checked_at",
                ]
            )

        return instance


class ReferenceBugSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferenceBug
        fields = ["id", "scenario", "description", "expected_behavior", "ui_element"]
        read_only_fields = ["id"]
