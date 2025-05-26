import { ACCESS_TOKEN, BASE_URL, CLIENT_ID, REFRESH_TOKEN, REMEMBER_ME } from "../constants";
import { SpotifyToken } from "../stores/spotify-token";
import { deleteLocalStorageItem, getLocalStorageItem, setLocalStorageItem } from "./localstorage";

const getCurrentHost = () => BASE_URL;

const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: any) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
}

export const requestSpotifyAuth = async () => {
    const codeVerifier = generateRandomString(64);
    const hash = await sha256(codeVerifier);
    const codeChallenge = base64encode(hash);

    setLocalStorageItem('codeVerifier', codeVerifier);

    const params = {
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-private user-read-email',
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: getCurrentHost(),
    }
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

export const handleSpotifyOauthRedirect = async (): Promise<SpotifyToken> => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const codeVerifier = getLocalStorageItem('codeVerifier');
    const isRememberMe = getLocalStorageItem(REMEMBER_ME) !== null;
    if (code === null || codeVerifier === null) {
        throw Error('Authorization code and/or codeVerifier is null');
    }
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: getCurrentHost(),
            code_verifier: codeVerifier,
        }),
    });
    if (!response.ok) {
        throw Error(`Invalid response code of: ${response.status}`)
    }
    const jsonResponse = await response.json();
    const result = {
        accessToken: jsonResponse['access_token'],
        refreshToken: jsonResponse['refresh_token']
    };

    if (isRememberMe) {
        setLocalStorageItem(ACCESS_TOKEN, result.accessToken);
        setLocalStorageItem(REFRESH_TOKEN, result.refreshToken);
    }
    
    deleteLocalStorageItem('codeVerifier');
    deleteLocalStorageItem(REMEMBER_ME);
    return result;
}