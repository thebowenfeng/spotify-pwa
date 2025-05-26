import useSWR from "swr";
import { spotifyFetcher } from "../utils/spotify-fetcher";
import { useEffect, useState } from "react";

const PLAYLIST_PAGE_SIZE = 50;
const TRACK_PAGE_SIZE = 50;

export interface SpotifyAccount {
    id: string;
    name: string;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    ownerName: string;
    image?: string;
}

export interface SpotifyTrack {
    id: string;
    artistNames: string[];
    albumName?: string;
    duration: number;
    name: string;
    coverImg?: string;
    // These are BE only attributes
    date: string;
    trackNumber: number;
    trackCount: number;
    url: string;
    isrc: string;
    popularity: number;
    albumId: string;
    artistId: string;
    albumType: string;
    albumArtist: string;
    force?: boolean;
}

interface PaginatedResult<T> {
    offset: number;
    items: T[];
    hasNextPage: boolean;
}

export const useSpotifyAccountData = (): SpotifyAccount => {
    const { data } = useSWR({ url: 'https://api.spotify.com/v1/me', method: 'GET' }, spotifyFetcher, { suspense: true });
    return {
        id: data['id'],
        name: data['display_name'],
    };
}

const spotifyPlaylistTransformer = (rawJson: any): SpotifyPlaylist | undefined => (
    {
        id: rawJson['id'],
        name: rawJson['name'],
        ownerName: rawJson['owner']['display_name'] ?? 'Unavailable',
        image: rawJson['images'].length > 0 ? rawJson['images'][0]['url'] : '',
    }
);

const spotifyTrackTransformer = (rawJson: any): SpotifyTrack | undefined => {
    if (rawJson['track']['type'] !== 'track') {
        return undefined;
    }
    
    return {
        id: rawJson['track']['id'],
        artistNames: rawJson['track']['artists'].map((obj: any) => obj['name']),
        duration: Number(rawJson['track']['duration_ms']),
        name: rawJson['track']['name'],
        albumName: rawJson['track']['album'] !== undefined ? rawJson['track']['album']['name'] : undefined,
        coverImg: rawJson['track']['album'] !== undefined && rawJson['track']['album']['images'].length > 0 ? rawJson['track']['album']['images'][0]['url'] : undefined,
        date: rawJson['track']['album'] !== undefined ? rawJson['track']['album']['release_date'] : '',
        trackNumber: rawJson['track']['track_number'],
        trackCount: rawJson['track']['album'] !== undefined ? rawJson['track']['album']['total_tracks'] : 1,
        url: rawJson['track']['external_urls'] !== undefined ? rawJson['track']['external_urls']['spotify'] : '',
        isrc: rawJson['track']['external_ids'] !== undefined ? rawJson['track']['external_ids']['isrc'] : '',
        popularity: rawJson['track']['popularity'],
        albumId: rawJson['track']['album'] !== undefined ? rawJson['track']['album']['id'] : '',
        artistId: rawJson['track']['artists'].length > 0 ? rawJson['track']['artists'][0]['id'] : '',
        albumType: rawJson['track']['album'] !== undefined ? rawJson['track']['album']['album_type'] : 'album',
        albumArtist: rawJson['track']['album'] !== undefined && rawJson['track']['album']['artists'].length > 0 ? rawJson['track']['album']['artists'][0]['name'] : '',
    }
}


const useGetPaginatedData = <T>(url: string, pageSize: number, mapper: (data: any) => T | undefined): T[] => {
    const [result, setResult] = useState<T[]>([]);
    const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<T> | null>(null);
    const { data } = useSWR({ url: `${url}?limit=${pageSize}`, method: 'GET' }, spotifyFetcher, { suspense: true });

    useEffect(() => {
        const setInitialResults = async () => {
            setResult(data['items'].map(mapper).filter((obj: T) => obj !== undefined));
            if (data['next'] !== null) {
                const resp = await spotifyFetcher({ url: `${url}?limit=${pageSize}&offset=${pageSize}`, method: 'GET' });
                setPaginatedResult({
                    items: resp['items'].map(mapper).filter((obj: T) => obj !== undefined),
                    offset: resp['offset'],
                    hasNextPage: resp['next'] !== null,
                });
            }
        }
        setInitialResults();
    }, []);

    useEffect(() => {
        const fetchNewResults= async () => {
            if (paginatedResult !== null) {
                setResult((prev) => [...prev, ...paginatedResult.items]);
                if (paginatedResult.hasNextPage) {
                    const resp = await spotifyFetcher({ url: `${url}?limit=${pageSize}&offset=${paginatedResult.offset + pageSize}`, method: 'GET' });
                    setPaginatedResult({
                        items: resp['items'].map(mapper).filter((obj: T) => obj !== undefined),
                        offset: resp['offset'],
                        hasNextPage: resp['next'] !== null,
                    });
                }
            }
        }
        fetchNewResults();
    }, [paginatedResult]);

    return result;
}

export const useSpotifyPlaylistsData = (): SpotifyPlaylist[] => useGetPaginatedData('https://api.spotify.com/v1/me/playlists', PLAYLIST_PAGE_SIZE, spotifyPlaylistTransformer);

export const useSpotifyTrackData = (playlistId: string): SpotifyTrack[] => useGetPaginatedData(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, TRACK_PAGE_SIZE, spotifyTrackTransformer);