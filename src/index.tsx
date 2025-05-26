// @ts-ignore
import React, { Suspense } from 'react';
import { createRoot } from "react-dom/client";
import App from './app';
import { deleteLocalStorageItem, getLocalStorageItem } from './utils/localstorage';
import { handleSpotifyOauthRedirect } from './utils/auth';
import { setToken } from './stores/spotify-token';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';

document.body.innerHTML += '<div id="app"></div>';
document.body.innerHTML += '<audio id="media-player" />'

const handleSpotifyRedirect = async () => {
    if (getLocalStorageItem('codeVerifier') !== null) {
        await setToken(handleSpotifyOauthRedirect);
    }
}

const retrieveTokenFromLS = () => {
    const accessToken = getLocalStorageItem(ACCESS_TOKEN);
    const refreshToken = getLocalStorageItem(REFRESH_TOKEN);
    if (accessToken && refreshToken) {
        setToken(() => Promise.resolve({ accessToken, refreshToken }));
    }
    return null;
}

retrieveTokenFromLS();
handleSpotifyRedirect().then(() => {
    // @ts-ignore
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
}).catch((err: Error) => {
    alert(`Error during spotify login: ${err.message}`);
    deleteLocalStorageItem('codeVerifier');
    // @ts-ignore
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
});
