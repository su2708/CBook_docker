from django.core.management.base import BaseCommand
from reminder.scheduler import start
import logging

class Command(BaseCommand):
    help = "Start the reminder scheduler"

    def handle(self, *args, **options):
        logging.info("Starting scheduler process...")
        try:
            start()  # ���ŷ �����ٷ� ����
        except KeyboardInterrupt:
            logging.info("Scheduler terminated gracefully.")
