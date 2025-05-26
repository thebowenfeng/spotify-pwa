from spotdl import Spotdl, Song
import yt_dlp
from fastapi import FastAPI, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
import uvicorn
import time
from urllib.parse import urlparse
from urllib.parse import parse_qs
import shutil
import mysql.connector
import requests
import io
import asyncio
from fastapi_sse import sse_handler
from pydantic import BaseModel
from typing import Protocol
from dataclasses import dataclass
import random

CLIENT_ID = "<spotify client id>"
CLIENT_SECRET = "<spotify client secret>"
DB_HOST = ""
DB_USERNAME = ""
DB_PASSWORD = ""
DB_NAME = ""

app = FastAPI()
total, used, free = shutil.disk_usage("/")

origins = ["*"]

class MyMessage(BaseModel):
    text: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def validation_exception_handler(_: Request, exc: Exception):
    print(f"Exception occured: {exc}")
    return PlainTextResponse(status_code=500, content=str(exc))

@dataclass
class SongCache:
    spotify_id: str
    music_url: str
    song_url: str
    last_access: int


class SongStore(Protocol):
    def select_song_by_id(self, spotify_id: str) -> SongCache | None:
        raise NotImplementedError("StoreService is an abstract interface")

    def select_song_last_accessed(self) -> SongCache | None:
        raise NotImplementedError("StoreService is an abstract interface")
    
    def insert_song(self, song: SongCache):
        raise NotImplementedError("StoreService is an abstract interface")
    
    def update_song_by_id(self, spotify_id: str, song_url: str | None, music_url: str | None):
        raise NotImplementedError("StoreService is an abstract interface")
    
    def update_song_last_access(self, spotify_id: str):
        raise NotImplementedError("StoreService is an abstract interface")
    
    def delete_song_by_id(self, spotify_id: str):
        raise NotImplementedError("StoreService is an abstract interface")


class CacheService(Protocol):
    def insert_cache(self, spotify_id: str, music_url: str, song_url: str):
        raise NotImplementedError("CacheService is an abstract interface")
    
    def get_cache(self, spotify_id: str) -> SongCache | None:
        raise NotImplementedError("CacheService is an abstract interface")
    
    def get_newest_cache(self) -> SongCache | None:
        raise NotImplementedError("CacheService is an abstract interface")
    
    def update_cache_music_url(self, spotify_id: str, music_url: str):
        raise NotImplementedError("CacheService is an abstract interface")
    
    def update_cache_song_url(self, spotify_id: str, song_url: str):
        raise NotImplementedError("CacheService is an abstract interface")
    
    def update_cache_last_access(self, spotify_id: str):
        raise NotImplementedError("CacheService is an abstract interface")
    
    def delete_cache_by_id(self, spotify_id: str):
        raise NotImplementedError("CacheService is an abstract interface")
    

class SpotifyService(Protocol):
    def get_download_url(self, song_obj: Song) -> str | None:
        raise NotImplementedError("SpotifyService is an abstract interface")
    

class DownloadService(Protocol):
    def get_vendor_search_song_url(self, search_str: str) -> str | None:
        raise NotImplementedError("DownloadService is an abstract interface")
    
    def get_song_url(self, download_url: str) -> str | None:
        raise NotImplementedError("DownloadService is an abstract interface")
    

class SongService(Protocol):
    def get_song_url(self, song: Song, is_force: bool) -> str:
        raise NotImplementedError("SongService is an abstract interface")
    
    def download_song(self, song: Song, is_force: bool) -> tuple[bytes, str]:
        raise NotImplementedError("SongService is an abstract interface")
    

class SongAPIController(Protocol):
    def get_song(self, json_body: dict) -> str:
        raise NotImplementedError("SongAPIController is an abstract interface")

    def download_song(self, json_body: dict) -> Response:
        raise NotImplementedError("SongAPIController is an abstract interface")
    

class SongStoreSQLImpl:
    def __init__(self, username: str, password: str, db_name: str):
        self.username = username
        self.password = password
        self.db_name = db_name

    def get_db(self):
        conn = mysql.connector.connect(host="192.168.1.203", user=self.username, password=self.password, database=self.db_name)
        cursor = conn.cursor()
        return conn, cursor

    def select_song_by_id(self, spotify_id: str) -> SongCache | None:
        _, cursor = self.get_db()
        cursor.execute(f"SELECT * FROM song_cache WHERE spotify_id=\"{spotify_id}\" LIMIT 1")
        result = cursor.fetchone()

        if result is None:
            return None
        return SongCache(
            spotify_id=result[0],
            music_url=result[1],
            song_url=result[2],
            last_access=result[3]
        )

    def select_song_last_accessed(self) -> SongCache | None:
        _, cursor = self.get_db()
        cursor.execute(f"SELECT spotify_id FROM song_cache ORDER BY last_access ASC")
        result = cursor.fetchone()

        if result is None:
            return None
        return SongCache(
            spotify_id=result[0],
            music_url=result[1],
            song_url=result[2],
            last_access=result[3]
        )
    
    def insert_song(self, song: SongCache):
        conn, cursor = self.get_db()
        if free < 5000000000:
            print(f"Running low on disk space! {free} bytes remaining. Performing cache eviction")
            last_song = self.select_song_last_accessed()
            if last_song is not None:
                self.delete_song_by_id(last_song.spotify_id)
        cursor.execute(f"INSERT IGNORE INTO song_cache (spotify_id, music_url, song_url, last_access) VALUES (\"{song.spotify_id}\", \"{song.music_url}\", \"{song.song_url}\", {song.last_access})")
        conn.commit()
    
    def update_song_by_id(self, spotify_id: str, song_url: str | None, music_url: str | None):
        conn, cursor = self.get_db()
        if song_url is None and music_url is None:
            # cursor.execute(f"UPDATE song_cache SET last_access = {int(time.time())} WHERE spotify_id = \"{spotify_id}\"")
            return
        elif song_url is None:
            cursor.execute(f"UPDATE song_cache SET music_url = \"{music_url}\" WHERE spotify_id = \"{spotify_id}\"")
        elif music_url is None:
            cursor.execute(f"UPDATE song_cache SET song_url = \"{song_url}\" WHERE spotify_id = \"{spotify_id}\"")
        else:
            cursor.execute(f"UPDATE song_cache SET music_url = \"{music_url}\", song_url = \"{song_url}\" WHERE spotify_id = \"{spotify_id}\"")
        conn.commit()

    def update_song_last_access(self, spotify_id: str):
        conn, cursor = self.get_db()
        cursor.execute(f"UPDATE song_cache SET last_access = {int(time.time())} WHERE spotify_id = \"{spotify_id}\"")
        conn.commit()
    
    def delete_song_by_id(self, spotify_id: str):
        conn, cursor = self.get_db()
        cursor.execute(f"DELETE FROM song_cache WHERE spotify_id = \"{spotify_id}\"")
        conn.commit()
    

class CacheServiceImpl:
    def __init__(self, store: SongStore):
        self.store = store

    def insert_cache(self, spotify_id: str, music_url: str, song_url: str):
        self.store.insert_song(SongCache(
            spotify_id=spotify_id,
            music_url=music_url,
            song_url=song_url,
            last_access=int(time.time())
        ))
    
    def get_cache(self, spotify_id: str) -> SongCache | None:
        return self.store.select_song_by_id(spotify_id)
    
    def get_newest_cache(self) -> SongCache | None:
        return self.store.select_song_last_accessed()
    
    def update_cache_music_url(self, spotify_id: str, music_url: str):
        self.store.update_song_by_id(spotify_id, None, music_url)
    
    def update_cache_song_url(self, spotify_id: str, song_url: str):
        self.store.update_song_by_id(spotify_id, song_url, None)

    def update_cache_last_access(self, spotify_id: str):
        self.store.update_song_last_access(spotify_id)
    
    def delete_cache_by_id(self, spotify_id: str):
        self.store.delete_song_by_id(spotify_id)


class SpotifyServiceImpl:
    def __init__(self, spot_dl: Spotdl):
        self.spot_dl = spot_dl

    def get_download_url(self, song_obj: Song) -> str | None:
        urls = self.spot_dl.get_download_urls([song_obj])
        if len(urls) == 0:
            return None
        return urls[0]
    

class DownloadServiceYouTubeImpl:
    def __init__(self, yt_downloader: yt_dlp.YoutubeDL):
        self.yt_downloader = yt_downloader

    def get_vendor_search_song_url(self, search_str: str) -> str | None:
        info = self.yt_downloader.extract_info(f"ytsearch:{search_str}", download=False)
        if info is None:
            return None
        entries = info["entries"]
        if len(entries) == 0:
            return None
        return entries[0]["url"]

    def get_song_url(self, download_url: str) -> str | None:
        song_info = self.yt_downloader.extract_info(download_url, download=False)
        is_invalid = song_info is None or "url" not in song_info or "expire" not in parse_qs(urlparse(song_info['url']).query) or len(parse_qs(urlparse(song_info['url']).query)["expire"]) == 0
        if is_invalid:
            return None
        return song_info["url"] if song_info is not None else None


class SongServiceImpl:
    def __init__(self, cache_service: CacheService, spotify_service: SpotifyService, download_service: DownloadService):
        self.cache_service = cache_service
        self.spotify_service = spotify_service
        self.download_service = download_service

    def __is_valid_song_url(self, song_url: str) -> bool:
        parsed_song_url = urlparse(song_url)
        parsed_song_query = parse_qs(parsed_song_url.query)
        if "expire" in parsed_song_query and len(parsed_song_query["expire"]) > 0:
            expiry_time = int(parsed_song_query["expire"][0])
            if expiry_time > time.time():
                return True
        return False

    def get_song_url(self, song: Song, is_force: bool) -> str:
        cached_song = self.cache_service.get_cache(song.song_id)
        is_using_cache = cached_song is not None and not is_force
        if cached_song is not None and is_using_cache and self.__is_valid_song_url(cached_song.song_url): 
            self.cache_service.update_cache_last_access(cached_song.spotify_id)
            return cached_song.song_url

        music_url = None if is_using_cache else self.spotify_service.get_download_url(song)
        if music_url is None:
            music_url = self.download_service.get_vendor_search_song_url(f"{song.name} - {song.artists[0]}")
            if music_url is None:
                raise Exception("Unable to find song vendor music URL")
        
        if not is_using_cache and cached_song:
            self.cache_service.update_cache_music_url(song.song_id, music_url)

        song_url = self.download_service.get_song_url(music_url)
        if song_url is None:
            raise Exception("Unable to find song downloadable URL")
        
        if cached_song:
            self.cache_service.update_cache_song_url(song.song_id, song_url)
            self.cache_service.update_cache_last_access(song.song_id)
        else:
            self.cache_service.insert_cache(song.song_id, music_url, song_url)
        return song_url
    
    def download_song(self, song: Song, is_force: bool) -> tuple[bytes, str]:
        url = self.get_song_url(song, is_force)
        response = requests.get(url, stream=True, headers={'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36', 'range': 'bytes=0-'})
        byte_array = io.BytesIO()
        for chunk in response.iter_content(chunk_size=1024):
            byte_array.write(chunk)
        byte_array.seek(0)
        return (byte_array.read(), response.headers['Content-Type'])


class SongAPIControllerImpl:
    def __init__(self, song_service: SongService):
        self.song_service = song_service

    def __get_song_obj(self, json_body: dict) -> Song:
        return Song(name=json_body['name'], 
                     artists=json_body['artistNames'], 
                     artist=json_body['artistNames'][0], 
                     genres=[], 
                     disc_number=1, 
                     disc_count=1, 
                     album_name=json_body['albumName'], 
                     album_artist=json_body['albumArtist'], 
                     duration=json_body['duration'], 
                     year=int(json_body['date'][:4]), 
                     date=json_body['date'], 
                     track_number=json_body['trackNumber'], 
                     tracks_count=json_body['trackCount'], 
                     song_id=json_body['id'], 
                     explicit=False, 
                     publisher='', 
                     url=json_body['url'], 
                     isrc=json_body['isrc'], 
                     cover_url=json_body['coverImg'], 
                     copyright_text='', 
                     download_url=None, 
                     lyrics=None, 
                     popularity=json_body['popularity'], 
                     album_id=json_body['albumId'], 
                     list_name=None, 
                     list_url=None, 
                     list_position=None, 
                     list_length=None, 
                     artist_id=json_body['artistId'], 
                     album_type=json_body['albumType']
                )

    def get_song(self, json_body: dict) -> str:
        song = self.__get_song_obj(json_body)
        return self.song_service.get_song_url(song, 'force' in json_body and json_body['force'] == True)

    def download_song(self, json_body: dict) -> Response:
        song = self.__get_song_obj(json_body)
        time.sleep(random.randint(1, 3))
        blob, content_type = self.song_service.download_song(song, 'force' in json_body and json_body['force'] == True)
        return Response(content=blob, media_type=content_type)


dl = Spotdl(client_id=CLIENT_ID, client_secret=CLIENT_SECRET, downloader_settings={ 'only_verified_results': False, "scan_for_songs": True })
video = yt_dlp.YoutubeDL({"format": "bestaudio", "default_search": "ytsearch", "noplaylist": True, "nocheckcertificate": True, "extract_flat": True, "skip_download": True, "ignoreerrors": True, "quiet": True})
song_store_obj = SongStoreSQLImpl(DB_USERNAME, DB_PASSWORD, DB_NAME)
cache_service_obj = CacheServiceImpl(song_store_obj)
spotify_service_obj = SpotifyServiceImpl(dl)
download_service_obj = DownloadServiceYouTubeImpl(video)
song_service_obj = SongServiceImpl(cache_service_obj, spotify_service_obj, download_service_obj)
song_api_controller_obj = SongAPIControllerImpl(song_service_obj)

@app.post("/song")
def song_endpoint(json_body: dict = Body(...)):
    return song_api_controller_obj.get_song(json_body)

@app.post("/download_song")
def download_song_endpoint(json_body: dict = Body(...)):
    return song_api_controller_obj.download_song(json_body)

@app.get("/healthcheck")
def healthcheck():
    # Test connection to DB
    mysql.connector.connect(host=DB_HOST, user=DB_USERNAME, password=DB_PASSWORD, database=DB_NAME)
    return "ok"

@app.get("/teststream")
@sse_handler()
async def message_stream():
    while True:
        yield MyMessage(text="test message")
        await asyncio.sleep(1)

@app.get("/exception")
async def exception():
    raise Exception("I am a test exception")

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
