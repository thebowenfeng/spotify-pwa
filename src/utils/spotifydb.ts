import { IDBPDatabase, IDBPTransaction } from "idb"
import { addDataToDB, checkIfDataExist, deleteDataFromDB, getDataFromDB, openIndexDB } from "./indexdb"

interface SpotifySongRecord {
    spotify_id: string;
    songData: Blob;
}

const VERSION = 1;

const handleSpotifyDbMigration = (database: IDBPDatabase<unknown>, oldVersion: number, _: number | null, __: IDBPTransaction<unknown, string[], "versionchange">, ___: IDBVersionChangeEvent) => {
    console.log(oldVersion);
    switch(oldVersion) {
        case 0:
            const store = database.createObjectStore('songs', {
                  keyPath: 'spotify_id'
            });
            store.createIndex('spotify_id', 'spotify_id', {
                unique: true
            });
    }
}

export const getSpotifyDb = async (version: number) => {
    return openIndexDB('spotifySongDB', version, handleSpotifyDbMigration);
}

export const addSong = async (data: SpotifySongRecord) => {
    return addDataToDB(await getSpotifyDb(VERSION), 'songs', data);
}

export const deleteSong = async (spotify_id: string) => {
    deleteDataFromDB(await getSpotifyDb(VERSION), 'songs', spotify_id);
}

export const getSong = async (spotify_id: string): Promise<SpotifySongRecord> => {
    return getDataFromDB(await getSpotifyDb(VERSION), 'songs', spotify_id);
}

export const checkIfSongExist = async (spotify_id: string) => {
    return await checkIfDataExist(await getSpotifyDb(VERSION), 'songs', spotify_id) === 1;
}