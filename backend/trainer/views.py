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
    http_method_names = ["get", "post", "head", "options"]

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


class ReferenceBugViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReferenceBugSerializer

    def get_queryset(self):
        queryset = ReferenceBug.objects.select_related("scenario").all()
        scenario_id = self.request.query_params.get("scenario_id")
        if scenario_id:
            queryset = queryset.filter(scenario_id=scenario_id)
        return queryset

