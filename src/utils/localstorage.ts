export const getLocalStorageItem = (key: string) => {
    try {
        return localStorage.getItem(key);
    } catch (err) {
        console.error(`Unable to get ${key} from local storage`, err);
        return null;
    }
};

export const setLocalStorageItem = (key: string, data: string) => {
    try {
        localStorage.setItem(key, data);
    } catch (err) {
        console.error(`Unable to set ${key} with ${data} to local storage`, err);
    }
}

export const deleteLocalStorageItem = (key: string) => {
    try {
        localStorage.removeItem(key)
    } catch (err) {
        console.error(`Unable to delete ${key} from local storage`, err);
    }
}