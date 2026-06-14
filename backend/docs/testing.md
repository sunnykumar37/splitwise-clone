# Testing Instructions

1. Copy `.env.example` to `.env` and configure PostgreSQL and Redis.
2. Create and activate a Python virtual environment.
3. Install dependencies with `pip install -r requirements.txt`.
4. Run database migrations:
   `python manage.py makemigrations`
   `python manage.py migrate`
5. Create a superuser if needed:
   `python manage.py createsuperuser`
6. Start the API server:
   `python manage.py runserver`
7. Start the Channels worker via Daphne or ASGI server in production.
8. Use Postman or curl to test registration, login, group creation, expense creation, settlements, and dashboard endpoints.
9. For chat validation, connect to the WebSocket endpoint with an expense participant's JWT and send a message payload.