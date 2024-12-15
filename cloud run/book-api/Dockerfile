# use lower python versions
FROM python:3.8-slim-bullseye

WORKDIR /app

# install required python libraries
COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

# important environment variables
ENV PYTHONUNBUFFERED=1

ENV HOST 0.0.0.0
ENV GOOGLE_ENTRYPOINT main.py
ENV FLASK_APP main

# expose the app on port 5000
EXPOSE 5000

# run the app
CMD ["python", "main.py"]
