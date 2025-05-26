export const debugLog = (message: any, ...args: any[]) => {
    if (process.env['NODE_ENV'] === 'development') {
        console.log(message, ...args);
    }
}