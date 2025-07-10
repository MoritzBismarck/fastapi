FROM python:3.11-slim

WORKDIR /app/

# Install Poetry
ENV UV_SYSTEM_PYTHON=1

# Allow installing dev dependencies to run tests
RUN pip install uv


COPY requirements.txt /app/

COPY ./app /app/app

RUN uv pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

COPY ./alembic.ini /app/

COPY ./alembic /app/

COPY ./prestart.sh /app/
