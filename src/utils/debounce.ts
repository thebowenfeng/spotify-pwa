export const debounce = (duration: number, func: (...args: any[]) => void) => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    return (...args: any[]) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), duration);
    }
}