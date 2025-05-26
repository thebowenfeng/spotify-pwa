from main import song_api_controller_obj
import requests
import time
import threading
import datetime

ACCESS_TOKEN = "<user access token>"
REFRESH_TOKEN = "<user refresh token>"
CLIENT_ID = "<spotify client id>"
PAGE_SIZE = 20
THREAD_POOL_SIZE = 20

def log_message(message: str):
    print(f"[{datetime.datetime.now()}] {message}")

def make_spotify_request(url: str, body: dict, method: str):
    global ACCESS_TOKEN
    global REFRESH_TOKEN

    response = requests.get(url, headers={ 'Authorization': f"Bearer {ACCESS_TOKEN}" }) if method == "GET" else requests.post(url, json=body, headers={ 'Authorization': f"Bearer {ACCESS_TOKEN}" })
    if (response.status_code == 401):
        refresh_token_response = requests.post("https://accounts.spotify.com/api/token", data={ "grant_type": 'refresh_token', "refresh_token": REFRESH_TOKEN, "client_id": CLIENT_ID })
        log_message(str(refresh_token_response))
        log_message(refresh_token_response.text)
        new_tokens = refresh_token_response.json()
        ACCESS_TOKEN = new_tokens["access_token"]
        REFRESH_TOKEN = new_tokens["refresh_token"]
        new_response = requests.get(url, headers={ 'Authorization': f"Bearer {ACCESS_TOKEN}" }) if method == "GET" else requests.post(url, json=body, headers={ 'Authorization': f"Bearer {ACCESS_TOKEN}" })
        return new_response
    else:
        return response

def get_spotify_playlists():
    playlist_ids = []
    offset = None
    while True:
        url_str = f"https://api.spotify.com/v1/me/playlists?limit={PAGE_SIZE}" if offset is None else f"https://api.spotify.com/v1/me/playlists?limit={PAGE_SIZE}&offset={offset}"
        response = make_spotify_request(url_str, {}, "GET").json()
        for playlist in response["items"]:
            playlist_ids.append(playlist["id"])
        if response["next"] is None:
            return playlist_ids
        offset = int(response["offset"]) + PAGE_SIZE

def get_spotify_tracks(playlist_id: str):
    tracks = []
    offset = None
    while True:
        url_str = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit={PAGE_SIZE}" if offset is None else f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit={PAGE_SIZE}&offset={offset}"
        response = make_spotify_request(url_str, {}, "GET").json()
        if "items" not in response:
            log_message(response)
        for track in response["items"]:
            tracks.append(track)
        if response["next"] is None:
            return tracks
        offset = int(response["offset"]) + PAGE_SIZE

def get_songs(tracks):
    for track in tracks:
        try:
            json_body = {
                "name": track["name"],
                "artistNames": list(map(lambda x: x["name"], track["artists"])),
                "albumName": track["album"]["name"],
                "albumArtist": track["album"]["artists"][0]["name"],
                "duration": int(track["duration_ms"]),
                "date": track["album"]["release_date"],
                "trackNumber": track["track_number"],
                "trackCount": track["album"]["total_tracks"],
                "id": track["id"],
                "url": track["external_urls"]["spotify"],
                "isrc": track["external_ids"]["isrc"],
                "popularity": track["popularity"],
                "albumId": track["album"]["id"],
                "artistId": track["artists"][0]["id"],
                "albumType": track["album"]["album_type"],
                "albumArtist": track["album"]["artists"][0]["name"],
                "coverImg": track['album']['images'][0]['url']
            }
            song_api_controller_obj.get_song(json_body)
            log_message(f"Succesfully indexed {track['name']}")
        except Exception as e:
            log_message(f"Unable to index {track['name']} Error: {str(e)}")

if __name__ == '__main__':
    while True:
        loop_start = time.time()
        playlists = get_spotify_playlists()
        for playlist_id in playlists:
            tracks = list(map(lambda x: x["track"], get_spotify_tracks(playlist_id)))
            threads: list[threading.Thread] = []
            num_per_thread = len(tracks) // THREAD_POOL_SIZE + 1
            for i in range(THREAD_POOL_SIZE):
                assigned_tracks = tracks[i * num_per_thread:(i + 1) * num_per_thread]
                thread = threading.Thread(target=get_songs, args=(assigned_tracks,))
                threads.append(thread)
                thread.start()
                if (i + 1) * num_per_thread >= len(tracks):
                    break
            for thread in threads:
                thread.join()
            
        loop_end = time.time()
        if loop_end - loop_start < 3600:
            time.sleep(3600 - (loop_end - loop_start))