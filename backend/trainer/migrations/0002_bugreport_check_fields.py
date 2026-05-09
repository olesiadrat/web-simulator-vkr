from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("trainer", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="bugreport",
            name="check_issues",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_recommendation",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_source",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_status",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_strengths",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="check_summary",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="checked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="matched_reference_bug",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="bugreport",
            name="reproduction_steps",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
