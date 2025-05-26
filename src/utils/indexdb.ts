import { IDBPDatabase, openDB, OpenDBCallbacks } from 'idb';

export const openIndexDB = async (dbName: string, version: number, handleDbMigration: OpenDBCallbacks<unknown>['upgrade']) => {
    return await openDB(dbName, version, {
        upgrade: handleDbMigration,
    });
}

export const addDataToDB = async (database: IDBPDatabase, tableName: string, data: any) => {
    await database.put(tableName, data);
}

export const deleteDataFromDB = async (database: IDBPDatabase, tableName: string, key: any) => {
    await database.delete(tableName, key);
}

export const getDataFromDB = async (database: IDBPDatabase, tableName: string, key: any) => {
    return database.get(tableName, key);
}

export const checkIfDataExist = async (database: IDBPDatabase, tableName: string, key: any) => {
    return database.count(tableName, key);
}