import { ACCESS_TOKEN, CLIENT_ID, REFRESH_TOKEN } from "../constants";
import { getLocalStorageItem, setLocalStorageItem } from "./localstorage";
import { getToken, setToken, SpotifyToken } from "../stores/spotify-token";

interface FetcherOptions {
    url: string;
    method: string;
    headers?: HeadersInit;
    body?: BodyInit;
}

// const delay = () => new Promise((resolve) => setTimeout(resolve, 2000));

export const spotifyFetcher = async (args: FetcherOptions) => {
    const token = await getToken();
    let response = await fetch(args.url, {
        method: args.method,
        headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            ...(args.headers ?? {})
        },
        body: args.body ?? null,
    });
    if (response.status === 401) {
        const refreshTokenReq = async () => {
            const url = "https://accounts.spotify.com/api/token";
            const refreshAuthResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: token.refreshToken,
                    client_id: CLIENT_ID
                }),
            });
            const refreshedTokens = await refreshAuthResponse.json();
            if (refreshAuthResponse.status === 400 && refreshedTokens['error'] === 'invalid_grant') {
                throw Error('INVALID_GRANT');
            }
            if (!refreshAuthResponse.ok) {
                throw Error(`Invalid response code of: ${response.status}`)
            }
            const newTokens: SpotifyToken = {
                accessToken: refreshedTokens['access_token'],
                refreshToken: refreshedTokens['refresh_token'],
            }
            return newTokens;
        }

        const newTokens = await setToken(refreshTokenReq);
        if (getLocalStorageItem(ACCESS_TOKEN) && getLocalStorageItem(REFRESH_TOKEN)) {
            setLocalStorageItem(ACCESS_TOKEN, newTokens.accessToken);
            setLocalStorageItem(REFRESH_TOKEN, newTokens.refreshToken);
        }
        response = await fetch(args.url, {
            method: args.method,
            headers: {
                'Authorization': `Bearer ${newTokens.accessToken}`,
                ...(args.headers ?? {})
            },
            body: args.body ?? null,
        });
    }
    if (!response.ok) {
        throw Error(`Request failed with status code: ${response.status} and message: ${response.body}`);
    }
    return await response.json();
}