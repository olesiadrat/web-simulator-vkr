from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import BugReport, ReferenceBug, Scenario, Session
from .serializers import (
    BugReportSerializer,
    ReferenceBugSerializer,
    ScenarioSerializer,
    SessionSerializer,
)
from .services.bug_check_service import BugCheckServiceError, check_bug_report


class ScenarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related("scenario").all()
    serializer_class = SessionSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    @action(detail=True, methods=["patch"])
    def finish(self, request, pk=None):
        session = self.get_object()
        session.end_time = timezone.now()
        session.save(update_fields=["end_time"])
        return Response(self.get_serializer(session).data)


class BugReportViewSet(viewsets.ModelViewSet):
    serializer_class = BugReportSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = BugReport.objects.select_related("session", "session__scenario").all()
        session_id = self.request.query_params.get("session_id")
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def check(self, request, pk=None):
        bug_report = self.get_object()
        reference_bugs = list(
            ReferenceBug.objects.filter(scenario=bug_report.session.scenario)
            .values("ui_element", "description", "expected_behavior")
        )
        bug_data = {
            "element": bug_report.ui_element,
            "description": bug_report.description,
            "steps": bug_report.reproduction_steps,
            "expected": bug_report.expected,
            "actual": bug_report.actual,
        }

        try:
            result = check_bug_report(
                scenario=bug_report.session.scenario,
                reference_bugs=reference_bugs,
                bug_data=bug_data,
            )
        except BugCheckServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        bug_report.check_status = result["status"]
        bug_report.check_score = result["score"]
        bug_report.check_summary = result["summary"]
        bug_report.check_strengths = result["strengths"]
        bug_report.check_issues = result["issues"]
        bug_report.check_recommendation = result["recommendation"]
        bug_report.matched_reference_bug = result["matched_reference_bug"]
        bug_report.check_source = result["source"]
        bug_report.checked_at = timezone.now()
        bug_report.save(
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
        return Response(self.get_serializer(bug_report).data, status=status.HTTP_200_OK)


class ReferenceBugViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReferenceBugSerializer

    def get_queryset(self):
        queryset = ReferenceBug.objects.select_related("scenario").all()
        scenario_id = self.request.query_params.get("scenario_id")
        if scenario_id:
            queryset = queryset.filter(scenario_id=scenario_id)
        return queryset
