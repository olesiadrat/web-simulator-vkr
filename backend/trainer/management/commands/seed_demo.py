from django.core.management.base import BaseCommand

from trainer.models import ReferenceBug, Scenario


DEMO_SCENARIO = {
    "startPageId": "home",
    "pages": [
        {
            "id": "home",
            "title": "Найди место для отдыха",
            "subtitle": "Выберите направление и даты поездки",
            "elements": [
                {
                    "id": "location",
                    "type": "select",
                    "label": "Локация",
                    "placeholder": "Куда вы хотите поехать?",
                    "requirements": [
                        "Допустимы буквы, пробел и дефис; цифры и спецсимволы не допускаются.",
                        "Поле обязательно для поиска: при пустом значении кнопка поиска должна быть неактивна или показывать валидацию.",
                        "После выбора локации значение должно сохраняться при переходе на страницу результатов и обратно.",
                    ],
                    "options": [
                        "Ленинградская область",
                        "Карелия",
                        "Краснодарский край",
                        "Алтай",
                    ],
                },
                {
                    "id": "check-in",
                    "type": "dateInput",
                    "label": "Дата заезда",
                },
                {
                    "id": "check-out",
                    "type": "dateInput",
                    "label": "Дата отъезда",
                },
                {
                    "id": "nights",
                    "type": "nightsSummary",
                    "label": "Количество ночей",
                    "startDateElementId": "check-in",
                    "endDateElementId": "check-out",
                },
                {
                    "id": "guests",
                    "type": "guestPicker",
                    "label": "Количество гостей",
                    "guests": 2,
                },
                {
                    "id": "search",
                    "type": "button",
                    "text": "Найти",
                    "action": {"type": "navigate", "targetPageId": "results"},
                },
                {
                    "id": "hero-image",
                    "type": "image",
                    "alt": "Домик в лесу",
                    "src": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
                },
            ],
        },
        {
            "id": "results",
            "title": "Доступные варианты",
            "subtitle": "Ленинградская область · 3 ночи",
            "elements": [
                {
                    "id": "results-location",
                    "type": "select",
                    "label": "Локация",
                    "placeholder": "Куда вы хотите поехать?",
                    "defaultValueFrom": "location",
                    "requirements": [
                        "Допустимы буквы, пробел и дефис; цифры и спецсимволы не допускаются.",
                        "Поле обязательно для поиска: при пустом значении кнопка поиска должна быть неактивна или показывать валидацию.",
                        "После выбора локации значение должно сохраняться при переходе на страницу результатов и обратно.",
                    ],
                    "options": [
                        "Ленинградская область",
                        "Карелия",
                        "Краснодарский край",
                        "Алтай",
                    ],
                },
                {
                    "id": "results-check-in",
                    "type": "dateInput",
                    "label": "Дата заезда",
                    "defaultValueFrom": "check-in",
                },
                {
                    "id": "results-check-out",
                    "type": "dateInput",
                    "label": "Дата отъезда",
                    "defaultValueFrom": "check-out",
                },
                {
                    "id": "results-guests",
                    "type": "guestPicker",
                    "label": "Гости",
                    "defaultValueFrom": "guests",
                    "guests": 2,
                },
                {
                    "id": "results-search",
                    "type": "button",
                    "text": "Обновить",
                    "action": {"type": "navigate", "targetPageId": "results"},
                },
                {
                    "id": "back-to-search",
                    "type": "link",
                    "text": "Назад к поиску",
                    "action": {"type": "navigate", "targetPageId": "home"},
                },
                {
                    "id": "forest-house-card",
                    "type": "card",
                    "title": "Уютный домик в лесу",
                    "description": "Идеально для спокойного отдыха на природе",
                    "detailsDescription": "Теплый деревянный домик среди сосен. Две спальни, кухня с обеденной зоной и терраса с видом на лес. Отличный вариант для тихого отдыха на выходных.",
                    "location": "Карелия",
                    "imageSrc": "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=80",
                    "images": [
                        "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
                    ],
                    "amenities": ["Wi‑Fi", "Кухня", "Камин", "Парковка", "Терраса"],
                    "rating": "4.9",
                    "meta": "4 500 ₽ / ночь",
                    "pricePerNight": 4500,
                    "action": {"type": "navigate", "targetPageId": "details"},
                },
                {
                    "id": "modern-cottage-card",
                    "type": "card",
                    "title": "Современный коттедж",
                    "description": "Стильный интерьер и все удобства",
                    "detailsDescription": "Просторный коттедж с панорамными окнами, современной кухней и отдельной зоной отдыха. Подходит для семейного отпуска и компаний до 6 человек.",
                    "location": "Ленинградская область",
                    "imageSrc": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
                    "images": [
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
                    ],
                    "amenities": ["Wi‑Fi", "Кухня", "Кондиционер", "Парковка", "Терраса"],
                    "rating": "4.8",
                    "meta": "6 200 ₽ / ночь",
                    "pricePerNight": 6200,
                    "action": {"type": "navigate", "targetPageId": "details"},
                },
                {
                    "id": "lake-cabin-card",
                    "type": "card",
                    "title": "Дом у озера",
                    "description": "Тихое место с террасой и видом на воду",
                    "detailsDescription": "Уютный дом прямо у воды: просторная спальня, кухня и терраса с видом на озеро. Хороший выбор для спокойного отдыха вдвоем или семьей.",
                    "location": "Алтай",
                    "imageSrc": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80",
                    "images": [
                        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1400&q=80",
                    ],
                    "amenities": ["Wi‑Fi", "Кухня", "Вид на озеро", "Парковка", "Терраса"],
                    "rating": "4.7",
                    "meta": "5 300 ₽ / ночь",
                    "pricePerNight": 5300,
                    "action": {"type": "navigate", "targetPageId": "details"},
                },
            ],
        },
        {
            "id": "details",
            "title": "Современный коттедж",
            "subtitle": "Ленинградская область",
            "elements": [
                {
                    "id": "back-to-results",
                    "type": "link",
                    "text": "Назад к списку",
                    "action": {"type": "navigate", "targetPageId": "results"},
                },
                {
                    "id": "details-gallery",
                    "type": "imageCarousel",
                    "alt": "Фотографии современного коттеджа",
                    "images": [
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80",
                        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
                    ],
                },
                {
                    "id": "details-description",
                    "type": "text",
                    "text": "Современный коттедж с дизайнерским интерьером. Подходит для семейного отдыха и компаний до 6 человек.",
                },
                {
                    "id": "amenities",
                    "type": "amenities",
                    "amenities": ["Wi‑Fi", "Кухня", "Кондиционер", "Парковка", "Терраса"],
                },
                {
                    "id": "booking",
                    "type": "bookingSummary",
                    "price": "6 200 ₽ / ночь",
                    "pricePerNight": 6200,
                    "guests": 2,
                    "total": "18 600 ₽",
                    "action": {"type": "none"},
                },
            ],
        },
    ],
}


REFERENCE_BUGS = [
    {
        "ui_element": "check-out",
        "description": "При выборе даты заезда нет ограничения на дату отъезда раньше даты заезда.",
        "expected_behavior": "Дата отъезда должна быть позже даты заезда.",
    },
    {
        "ui_element": "booking",
        "description": "Кнопка бронирования доступна без заполнения дат.",
        "expected_behavior": "Кнопка должна быть неактивна, пока даты не заполнены.",
    },
    {
        "ui_element": "modern-cottage-card-price",
        "description": "Цена в карточке может отличаться от итоговой стоимости на странице бронирования.",
        "expected_behavior": "Цена должна быть согласована во всех частях интерфейса.",
    },
    {
        "ui_element": "location",
        "description": "Список локаций ограничен и не содержит поиска по направлению.",
        "expected_behavior": "Пользователь должен понимать, что список ограничен, или иметь возможность поиска.",
    },
    {
        "ui_element": "booking-total",
        "description": "Сумма к оплате может отображаться до выбора дат.",
        "expected_behavior": "Итоговая сумма должна пересчитываться только по валидным датам.",
    },
]


class Command(BaseCommand):
    help = "Create demo scenario and reference bugs."

    def handle(self, *args, **options):
        scenario, created = Scenario.objects.update_or_create(
            title="Поиск места для отдыха",
            defaults={
                "description": "Демонстрационный сценарий для тренировки поиска UI-дефектов.",
                "json_structure": DEMO_SCENARIO,
            },
        )

        ReferenceBug.objects.filter(scenario=scenario).delete()
        for bug in REFERENCE_BUGS:
            ReferenceBug.objects.create(scenario=scenario, **bug)

        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Demo scenario {action}: {scenario.id}"))
