# UI Testing Trainer

Веб-приложение-тренажер для обучения тестированию пользовательских интерфейсов.

## Цель проекта

Пользователь выбирает учебный сценарий, проходит динамически сгенерированный UI, находит ошибки интерфейса, оформляет баг-репорты и видит результаты в рамках текущей сессии.

## Стек

- Frontend: React + TypeScript
- Backend: Django REST Framework
- Database: PostgreSQL
- API: REST

## Структура

```text
web-simulator-vkr/
  backend/
  frontend/
  docs/
```

## Этапы разработки

1. Подготовить каркас проекта и документацию.
2. Реализовать backend-модели и REST API.
3. Реализовать frontend для выбора сценария.
4. Добавить динамический рендеринг UI по JSON.
5. Добавить создание и отображение баг-репортов.
6. Подготовить демонстрационный сценарий и материалы для ВКР.

## Backend: запуск

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API будет доступно по адресу:

```text
http://127.0.0.1:8000/api/
```

Если PostgreSQL еще не установлен локально, для первого запуска можно временно указать в `backend/.env`:

```text
USE_SQLITE=True
```

В финальной версии проекта для ВКР используем PostgreSQL.

## Frontend

```bash
cd frontend
npm install --cache /tmp/web-simulator-npm-cache
npm run dev
```

Frontend будет доступен по адресу:

```text
http://127.0.0.1:5173/
```

Если `node` установлен в `/usr/local/bin`, но не находится в PATH, запускайте команды так:

```bash
PATH=/usr/local/bin:$PATH npm run dev
```
