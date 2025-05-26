import { useCallback, useEffect, useState, useTransition } from 'react';
import InstallationScreen from './screens/installation';
import { CurrentPageContext, CurrentSongListContext, Route, SongList } from './contexts';
import { deleteLocalStorageItem, getLocalStorageItem, setLocalStorageItem } from './utils/localstorage';
import { ACCESS_TOKEN, PWA_PREFERENCE, REFRESH_TOKEN } from './constants';
import WebWarning from './components/web-alert';
import { isRunningPwa, registerAndCheckServiceWorker } from './utils/pwa';
import Login from './screens/login';
import Home from './screens/home';
import styled from 'styled-components';
import Footer from './components/footer';
import Search from './screens/search';
import { doesTokenExist } from './stores/spotify-token';
import PlaylistScreen from './screens/playlist';
import MediaPlayer from './components/media-player';
import ErrorBoundary from './components/error-boundary';

const RootPageContainer = styled.div`
    display: grid;
    grid-template-rows: 1fr auto;
    height: 98vh;
`

const setPwaPreferenceIfNull = () => {
    if (isRunningPwa()) {
        setLocalStorageItem(PWA_PREFERENCE, 'pwa');
    }
}

const setInitialPage = (): Route => {
    if (getLocalStorageItem(PWA_PREFERENCE) === null && !isRunningPwa()) {
        return { page: 'install'};
    }
    if (doesTokenExist()) {
        return { page: 'home'};
    }
    return { page: 'login'};
}

const App = () => {
    const [currentPage, setCurrentPage] = useState<Route>(setInitialPage);
    const [deferPrompt, setDeferPrompt] = useState<any | undefined>(undefined);
    const [currentSongList, setCurrentSongList] = useState<SongList | null>(null);
    const [_, setStartPageTransition] = useTransition();

    const handleSetPage = useCallback((newPage: Route) => {
        setStartPageTransition(() => {
            setCurrentPage(newPage);
        });
    }, []);

    const handleHomeError = (err: any) => {
        if (err.message.includes("INVALID_GRANT")) {
            deleteLocalStorageItem(ACCESS_TOKEN);
            deleteLocalStorageItem(REFRESH_TOKEN);
            handleSetPage({ page: 'login' });
        }
    }

    const handleSetSongList = useCallback((newSongList: SongList) => {
        setCurrentSongList(newSongList);
    }, []);

    const handleSetDeferPrompt = () => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferPrompt(e);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    useEffect(() => {
        handleSetDeferPrompt();
        window.resizeTo(412, 816);
        setPwaPreferenceIfNull();
        registerAndCheckServiceWorker();
    }, []);

    return (
        <CurrentPageContext.Provider value={[currentPage, handleSetPage]}>
            <CurrentSongListContext.Provider value={[currentSongList, handleSetSongList]}>
                <WebWarning />
                {currentPage.page === 'install' && <InstallationScreen deferPrompt={deferPrompt} />}
                {currentPage.page === 'login' && <Login />}
                {currentPage.page !== 'login' && currentPage.page !== 'install' && 
                    <RootPageContainer>
                        {currentPage.page === 'home' && (
                            <ErrorBoundary fallbackComponent={undefined} onError={handleHomeError}>
                                <Home />
                            </ErrorBoundary>
                        )}
                        {currentPage.page === 'search' && <Search />}
                        {currentPage.page === 'playlist' && <PlaylistScreen />}
                        <MediaPlayer />
                        <Footer />
                    </RootPageContainer>
                }
            </CurrentSongListContext.Provider>
        </CurrentPageContext.Provider>
    )
}

export default App;