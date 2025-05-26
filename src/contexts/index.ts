import { createContext } from "react";
import { SpotifyTrack } from "../hooks/spotify";

type Page = 'install' | 'login' | 'home' | 'search' | 'settings' | 'playlist';

export interface Route {
    page: Page;
    options?: any;
}

export interface SongList {
    index: number;
    songs: SpotifyTrack[]
}

export const CurrentPageContext = createContext<[Route, (newPage: Route) => void]>([{ page: 'install'}, () => null]);

export const CurrentSongListContext = createContext<[SongList | null, (newSongList: SongList) => void]>([null, () => null]);