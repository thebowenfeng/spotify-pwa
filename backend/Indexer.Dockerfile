FROM python:3.11

RUN apt-get -y update && apt-get -y upgrade && apt-get install -y ffmpeg

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
RUN pip install fastapi uvicorn

COPY ./index_songs.py /code/app/index_songs.py

COPY ./main.py /code/app/main.py

WORKDIR /code/app

ENV PYTHONUNBUFFERED=1

CMD ["python", "index_songs.py"]