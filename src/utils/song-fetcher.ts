import { BASE_URL } from "../constants";
import { SpotifyTrack } from "../hooks/spotify";

const apiBaseUrl = process.env['NODE_ENV'] === 'development' ? `${BASE_URL}:8000` : `${BASE_URL}/api/spotify`;

const awaitTimeout = (ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
})

const retryableFetch = async (url: string, config: RequestInit): Promise<Response> => {
    for (let i = 0; i < 3; i++) {
        try {
            return await fetch(url, config);
        } catch (_) {
            await awaitTimeout(2500);
        }
    }
    throw Error(`Request for ${url} failed after 3 retries`);
}

export const fetchSpotifySong = async (track: SpotifyTrack) => {
    const songUrlResp = await retryableFetch(`${apiBaseUrl}/song`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(track),
        signal: AbortSignal.timeout(30000)
    });
    if (!songUrlResp.ok) {
        throw Error(await songUrlResp.text());
    }
    return (await songUrlResp.text()).replaceAll('"', '');
}

export const downloadSpotifySong = async (track: SpotifyTrack) => {
    const songUrlResp = await retryableFetch(`${apiBaseUrl}/download_song`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(track),
        signal: AbortSignal.timeout(30000)
    });
    if (!songUrlResp.ok) {
        throw Error(await songUrlResp.text());
    }
    return await songUrlResp.blob();
}