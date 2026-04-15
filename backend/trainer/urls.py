from rest_framework.routers import DefaultRouter

from .views import BugReportViewSet, ReferenceBugViewSet, ScenarioViewSet, SessionViewSet


router = DefaultRouter()
router.register("scenarios", ScenarioViewSet, basename="scenario")
router.register("sessions", SessionViewSet, basename="session")
router.register("bugs", BugReportViewSet, basename="bug")
router.register("reference-bugs", ReferenceBugViewSet, basename="reference-bug")

urlpatterns = router.urls

