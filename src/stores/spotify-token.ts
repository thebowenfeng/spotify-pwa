export interface SpotifyToken {
    accessToken: string;
    refreshToken: string;
}

let token: SpotifyToken | null = null;
let isLocked: boolean = false;
let resolvers: Array<(token: SpotifyToken) => void> = [];

export const doesTokenExist = () => token !== null;

export const getToken = async () => {
    if (isLocked) {
        return new Promise<SpotifyToken>((resolve) => {
            resolvers.push(resolve);
        })
    }
    if (token === null) {
        throw Error('Spotify token is null!');
    }
    return token;
}

export const setToken = async (func: () => Promise<SpotifyToken>) => {
    isLocked = true;
    const newToken = await func();
    token = JSON.parse(JSON.stringify(newToken));
    isLocked = false;
    resolvers.forEach((resolver) => resolver(token!));
    resolvers = [];
    return token!;
}