import { useCallback, useEffect, useState } from "react";

interface AsyncLoading {
    state: 'loading';
    value: undefined;
    error: undefined;
}

interface AsyncSuccess<T> {
    state: 'success';
    value: T;
    error: undefined;
}

interface AsyncError {
    state: 'error';
    value: undefined;
    error: any;
}

type AsyncState<T> = AsyncLoading | AsyncSuccess<T> | AsyncError

interface Current {
    isCurrent: boolean;
}

export const useAsync = <T>(asyncFunc: () => Promise<T>): AsyncState<T> => {
    const [state, setState] = useState<AsyncState<T>>({ state: 'loading', value: undefined, error: undefined });

    const funcCall = useCallback((current: Current) => {
        setState({ state: 'loading', value: undefined, error: undefined });
        asyncFunc().then((result) => {
            if (current.isCurrent) {
                setState({ state: 'success', value: result, error: undefined });
            }
        }).catch((err) => {
            if (current.isCurrent) {
                setState({ state: 'error', value: undefined, error: err });
            }
        })
    }, [asyncFunc]);

    useEffect(() => {
        const current = { isCurrent: true };
        funcCall(current);
        return () => {
            current.isCurrent = false;
        }
    }, [asyncFunc]);

    return state;
}