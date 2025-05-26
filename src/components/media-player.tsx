import { useCallback, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { CurrentSongListContext } from "../contexts";
import { CircularProgress, IconButton, Slider, Snackbar, Typography } from "@mui/joy";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { useAsync } from "../hooks/use-async";
import messages from "../messages";
import { downloadSpotifySong, fetchSpotifySong } from "../utils/song-fetcher";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { debounce } from "../utils/debounce";
import { addSong, checkIfSongExist, deleteSong, getSong } from "../utils/spotifydb";

const RootContainer = styled.div`
    height: 75px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    &:hover {
        background-color: lightgray;
    };
`;

const SongInfoContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 5px;
`;

const SongTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    width: 40vw;
`;

const MediaControllerContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 5px;
    margin-right: 3vw;
`;

const ExpandedContainer = styled.div`
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 92vh;
    bottom: 8vh;
    background-color: white;

    @keyframes rise-up {
        0% { height: 0vh; }
        100% { height: 92vh;  }
    };

    animation: rise-up;
    animation-duration: 0.6s;
`;

const MinimizeContainer = styled.div`
    display: flex;
    position: absolute;
    top: 10px;
    left: 10px;
`;

const ExpandedContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
`;

const ExpandedSongTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
`;

const NoTextOverflowContainer = styled.div`
    width: 70vw;
    text-align: center;
`;

const ExpandedMediaControllerContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 5px;
`;

const ScrollerContainer = styled.div`
    width: 65vw;
`


const getErrorText = (error: any) => {
    if (error.name === 'NotSupportedError') {
        return messages.songNotSupported;
    }
    return error.message;
}

const MediaPlayer = () => {
    const updatePosition = () => {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
        });
    }

    const audio = document.getElementById('media-player')! as HTMLAudioElement;
    const [currentSongList, setCurrentSongList] = useContext(CurrentSongListContext);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [isErrorOpen, setIsErrorOpen] = useState<boolean>(true);
    const isUpdatingRef = useRef(false);
    const currentSong = currentSongList ? currentSongList.songs[currentSongList.index] : null;

    const playAudio = useCallback(async () => {
        if (currentSongList !== null && currentSong !== null) {
            if (await checkIfSongExist(currentSong.id)) {
                if (currentSong.force) {
                    await deleteSong(currentSong.id);
                    const songBlob = await downloadSpotifySong(currentSong);
                    await addSong({ spotify_id: currentSong.id, songData: songBlob });
                }
                const data = await getSong(currentSong.id);
                audio.src = URL.createObjectURL(data.songData);
            } else {
                audio.src = await fetchSpotifySong(currentSong);
            }
            delete currentSong.force;
            await audio.play();

            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentSong.name,
                artist: currentSong.artistNames.length > 0 ? currentSong.artistNames[0] : 'Unknown',
                album: currentSong.albumName ?? 'Unknown',
                artwork: [{ src: currentSong.coverImg ?? '' }],
            });
            updatePosition();
            setIsPlaying(true);
        }
    }, [currentSongList]);
    const playAudioResponse = useAsync(playAudio);

    useEffect(() => {
        if (playAudioResponse.state === 'loading') {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Loading...',
                artist: 'Loading...',
                album: 'Loading...',
            });
        }
    }, [playAudioResponse]);

    const handlePreviousTrack = () => {
        audio.src = '';
        if (currentSongList !== null) {
            if (currentSongList.index === 0) {
                setCurrentSongList({ index: currentSongList.songs.length - 1, songs: currentSongList.songs });
                return;
            }
            setCurrentSongList({ index: currentSongList.index - 1, songs: currentSongList.songs });
        }
    };

    const handleNextTrack = () => {
        audio.src = '';
        if (currentSongList !== null) {
            if (currentSongList.index === currentSongList.songs.length - 1) {
                setCurrentSongList({ index: 0, songs: currentSongList.songs });
                return;
            }
            setCurrentSongList({ index: currentSongList.index + 1, songs: currentSongList.songs });
        }
    }

    const handleSeekBack = (e: MediaSessionActionDetails) => {
        if (playAudioResponse.state === 'success') {
            const skipTime = e.seekOffset || 10;
            audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
            updatePosition(); 
        }
    }

    const handleSeekForward = (e: MediaSessionActionDetails) => {
        if (playAudioResponse.state === 'success') {
            const skipTime = e.seekOffset || 10;
            audio.currentTime = Math.max(audio.currentTime + skipTime, audio.duration);
            updatePosition(); 
        }
    }

    const handlePlay = async () => {
        if (playAudioResponse.state === 'success') {
            await audio.play();
            setIsPlaying(true);
        }
    }

    const handlePause = () => {
        if (playAudioResponse.state === 'success') {
            audio.pause();
            setIsPlaying(false);
        }
    }

    const handleSeek = (e: MediaSessionActionDetails) => {
        if (playAudioResponse.state === 'success') {
            if (e.seekTime !== undefined) {
                if (e.fastSeek && ('fastSeek' in audio)) {
                    audio.fastSeek(e.seekTime);
                    return;
                }
                audio.currentTime = e.seekTime;
                updatePosition();
            }
        }
    }

    const updateAudioTime = useCallback(debounce(250, (_: any, value: number | number[]) => {
        if (Number.isInteger(value)) {
            audio.currentTime = value as number;
            updatePosition();
            isUpdatingRef.current = false;
        }
    }), []);

    const handleSliderSeek = (evt: any, value: number | number[]) => {
        isUpdatingRef.current = true;
        if (Number.isInteger(value)) {
            setSliderValue(value as number);
        }
        updateAudioTime(evt, value);
    }

    useEffect(() => {
        navigator.mediaSession.setActionHandler('previoustrack', handlePreviousTrack);
        navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
        navigator.mediaSession.setActionHandler('seekbackward', handleSeekBack);
        navigator.mediaSession.setActionHandler('seekforward', handleSeekForward);
        navigator.mediaSession.setActionHandler('play', handlePlay);
        navigator.mediaSession.setActionHandler('pause', handlePause);
        audio.addEventListener('ended', handleNextTrack);
        try {
            navigator.mediaSession.setActionHandler('seekto', handleSeek)
        } catch (err) {
            console.error('Media seek not supported');
        }

        if (playAudioResponse.state === 'error') {
            setIsErrorOpen(true);
        }

        return () => audio.removeEventListener('ended', handleNextTrack);
    }, [playAudioResponse]);

    useEffect(() => {
        // These event listeners are added once. Since this component is a singleton, no need to unregister
        audio.addEventListener('play', () => navigator.mediaSession.playbackState = 'playing');
        audio.addEventListener('pause', () => navigator.mediaSession.playbackState = 'paused');
        audio.addEventListener("timeupdate", () => {
            if (!isUpdatingRef.current) {
                setSliderValue(audio.currentTime);
            }
        });
    }, []);

    if (currentSongList === null || currentSong === null) {
        return null;
    }

    if (isExpanded) {
        return (
            <ExpandedContainer>
                {playAudioResponse.state === 'error' && 
                    <Snackbar
                        autoHideDuration={1500}
                        color="danger"
                        variant="solid"
                        open={isErrorOpen}
                        onClose={() => setIsErrorOpen(false)}
                    >
                        {getErrorText(playAudioResponse.error)}
                    </Snackbar>
                }
                <MinimizeContainer>
                    <IconButton variant="plain" onClick={() => setIsExpanded(false)}>
                        <ExpandMoreIcon fontSize="large" />
                    </IconButton>
                </MinimizeContainer>
                <ExpandedContentContainer>
                    <img src={currentSong.coverImg} height={275} width={275} />
                    <ExpandedSongTextContainer>
                        <NoTextOverflowContainer>
                            <Typography level="h3" noWrap>{currentSong.name}</Typography>
                        </NoTextOverflowContainer>
                        <NoTextOverflowContainer>
                            <Typography level="title-md" noWrap>{currentSong.artistNames.join(', ')}</Typography>
                        </NoTextOverflowContainer>
                    </ExpandedSongTextContainer>
                    {playAudioResponse.state === 'loading' && <CircularProgress />}
                    {playAudioResponse.state === 'success' && 
                        <ScrollerContainer>
                            <Slider 
                                size="sm" 
                                max={Math.round(currentSong.duration / 1000)} 
                                onChange={handleSliderSeek}
                                value={sliderValue}
                            />
                        </ScrollerContainer>
                    }
                    {playAudioResponse.state !== 'loading' && 
                        <ExpandedMediaControllerContainer>
                            <IconButton variant="plain" onClick={(e) => {
                                e.stopPropagation();
                                handlePreviousTrack();
                            }}>
                                <SkipPreviousIcon style={{ fontSize: '65px' }} />
                            </IconButton>
                            <IconButton variant="plain" onClick={(e) => {
                                e.stopPropagation();
                                if (isPlaying) {
                                    return handlePause();
                                }
                                handlePlay();
                            }}>
                                {isPlaying ? <PauseCircleIcon style={{ fontSize: '65px' }} /> : <PlayCircleIcon style={{ fontSize: '65px' }} />}
                            </IconButton>
                            <IconButton variant="plain" onClick={(e) => {
                                e.stopPropagation();
                                handleNextTrack();
                            }}>
                                <SkipNextIcon style={{ fontSize: '65px' }} />
                            </IconButton>
                        </ExpandedMediaControllerContainer>
                    }
                </ExpandedContentContainer>
            </ExpandedContainer>
        )
    }

    return (
        <RootContainer onClick={() => setIsExpanded(true)}>
            {playAudioResponse.state === 'error' && 
                <Snackbar
                    autoHideDuration={1500}
                    color="danger"
                    variant="solid"
                    open={isErrorOpen}
                    onClose={() => setIsErrorOpen(false)}
                >
                    {getErrorText(playAudioResponse.error)}
                </Snackbar>
            }
            <SongInfoContainer>
                <img src={currentSong.coverImg} height={75} width={75} />
                <SongTextContainer>
                    <Typography level="title-md" noWrap>{currentSong.name}</Typography>
                    <Typography level="body-sm" noWrap>{currentSong.artistNames.join(', ')}</Typography>
                </SongTextContainer>
            </SongInfoContainer>
            <MediaControllerContainer>
                {playAudioResponse.state === 'loading' && <CircularProgress />}
                {playAudioResponse.state !== 'loading' && (
                    <>
                        <IconButton variant="plain" onClick={(e) => {
                            e.stopPropagation();
                            handlePreviousTrack();
                        }}>
                            <SkipPreviousIcon fontSize="large" />
                        </IconButton>
                        <IconButton variant="plain" onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying) {
                                return handlePause();
                            }
                            handlePlay();
                        }}>
                            {isPlaying ? <PauseCircleIcon fontSize="large" /> : <PlayCircleIcon fontSize="large" />}
                        </IconButton>
                        <IconButton variant="plain" onClick={(e) => {
                            e.stopPropagation();
                            handleNextTrack();
                        }}>
                            <SkipNextIcon fontSize="large" />
                        </IconButton>
                    </>
                )}
            </MediaControllerContainer>
        </RootContainer>
    )
}

export default MediaPlayer;