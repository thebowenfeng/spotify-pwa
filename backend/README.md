# Spotify PWA backend

Backend component for `spotify-pwa`. Converts Spotify tracks to raw music data using YouTube.

## Local development

**Valid for both local and prod**: Fill in all missing constants at the top of `main.py`. Both `CLIENT_ID` and `CLIENT_SECRET` refer to Spotify's API app client_id and client_secret.

A SQL server (preferably MySQL) is required by default, with a database that contains `song_cache` table with the following schema:
```
+-------------+---------+------+-----+---------+-------+
| Field       | Type    | Null | Key | Default | Extra |
+-------------+---------+------+-----+---------+-------+
| spotify_id  | text    | YES  | UNI | NULL    |       |
| music_url   | text    | YES  |     | NULL    |       |
| song_url    | text    | YES  |     | NULL    |       |
| last_access | int(11) | YES  |     | NULL    |       |
+-------------+---------+------+-----+---------+-------+
```
If SQL is not possible or preference for different DB, then new `SongStore` (L57) implementation must be provided in `main.py`.

(Optional) Provision a new virtual environment.

Run `pip install -r requirements.txt` to install all dependencies.

Run `python main.py` will run a local dev server on port 8000.

## Production

BE is fully dockerized and will serve on port 8000 via HTTP.

It is recommended to handle TLS/SSL (HTTPS) in a reverse proxy/load balancer and perform TLS termination, and as such this app does not support HTTPS natively. However, HTTPS **is required** if the FE is served via HTTPS (most browsers will forbid HTTP calls on a HTTPS site).

By default, this app runs on a single uvicorn worker. Scaling is fully supported and safe. However, beware of YouTube rate limiting for heavy loads.

## Indexer

`index_songs.py` is a support tool/job that performs song indexing in the background. When a new song is requested and cache doesn't exist, normally the server will have to query `SpotDL` to retrieve the YouTube URL, then using `yt-dlp` to retrieve a decrypted, playable music URL. Every new song is then subsequently cached with the aforementioned data in order to drastically speed up response times. However, the playable URL will have to be re-retrieved periodically due to expiry time enforced by YouTube, but the video URL itself rarely needs to be re-retrieved.

`index_songs.py` will periodically update the cache with the most recent song URL in order to minimise the chance of a cache miss, and continuously index new songs that were previously not cached.

### Running the script

The script re-uses all business logic related to song fetching (i.e it re-uses `main.py`'s controller) as the API server. As such, it also requires the same access to a SQL server as specified by the API server. More details above.

`index_songs.py` is built as a user-specific script. That is, it will take a user's playlists and repeatedly index it. It is fully dockerized via `Indexer.Dockerfile`.

Before running it, constants at the top of the script must be filled out, where `ACCESS_TOKEN` and `REFRESH_TOKEN` are respectively a Spotify user's OAuth tokens. Constants at the top of `main.py` must also be filled accordingly as code is imported from `main.py`.

The script is designed to be run as a single process per user, with a thread pool that can be adjusted. Beware of YouTube rate limiting for higher thread counts. It will continually run without shutting down until an error occurs.

