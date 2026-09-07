FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# backend/ carries artifacts/ with it - the API will not start without the
# trained models, so they are part of the image rather than a mounted volume.
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8000

# Render/Railway/Fly inject the listen port as $PORT; default to 8000 locally.
ENV PORT=8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
