# Spotify PWA

An offline Spotify listener as a progressive web app (PWA), backed by YouTube.

## How it works

`spotify-pwa` authenticates on behalf of a Spotify user, retrieves their playlists using Spotify's API, then sources raw music data from YouTube (see `backend/README.md`).

`spotify-pwa` heavily caches resources using service workers to enable a full offline experience, and allows downloading raw music files to phone storage.

## Local development

**Important for both local and prod**: Fill in `CLIENT_ID` in `constants.ts`. This is Spotify API's app client_id.

See `backend/README.md` for backend specific instructions

Run `yarn` or `yarn install` in repository root.

Run `yarn dev` to compile scripts using webpack. Webpack will watch for any file changes and automatically re-compile, so no need to re-run.

Run `node dev-server.js` to run a local HTTP server in order to serve ReactJS files.

## Production

Fill in deployment URL in `constants.ts` 

See `backend/README.md` for backend specific instructions

`spotify-pwa` is fully dockerized. Files are served via port 8080 via HTTP. Before building docker image, app must be built via `yarn build:prod`. Docker assumes a pre-built copy is available in `./build`. 

`yarn build:prod` will generate a production copy of the app in `./build`.

`yarn run:prod` will run a HTTP server on port 8080 via HTTP.

It is recommended to handle TLS/SSL (HTTPS) in a reverse proxy/load balancer and perform TLS termination, and as such this app does not support HTTPS natively. However, HTTPS **is required** in order to access PWA specific functionality (such as service workers/offline caching). The app will function without HTTPS, but offline capabilities will not work.

Production HTTP servers will serve files from the root path (/) and hence this app does not natively support deployments to subdirectories (e.g mywebsite.com/spotify-pwa).