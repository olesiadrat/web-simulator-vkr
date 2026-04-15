from django.db import models


class Scenario(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    json_structure = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Session(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name="sessions")
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"Session {self.pk} for {self.scenario}"


class BugReport(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="bug_reports")
    description = models.TextField()
    expected = models.TextField()
    actual = models.TextField()
    ui_element = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"BugReport {self.pk}"


class ReferenceBug(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE, related_name="reference_bugs")
    description = models.TextField()
    expected_behavior = models.TextField()
    ui_element = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Reference bug for {self.scenario}"

