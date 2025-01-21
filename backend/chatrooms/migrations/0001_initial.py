# Generated by Django 4.2 on 2025-01-21 16:53

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('message_id', models.IntegerField(blank=True, null=True)),
                ('message_content', models.JSONField()),
                ('sent_by', models.CharField(choices=[('user', 'User'), ('ai', 'AI')], max_length=20)),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('action', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='ChatRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.IntegerField(blank=True, default=None, null=True)),
                ('chat_name', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
