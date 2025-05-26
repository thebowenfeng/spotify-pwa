import { Suspense, useContext, useEffect, useState } from "react";
import { CurrentPageContext, CurrentSongListContext } from "../contexts";
import styled from "styled-components";
import { IconButton, Typography } from "@mui/joy";
import { ListLoadingShimmer } from "../components/shimmer";
import { SpotifyTrack, useSpotifyTrackData } from "../hooks/spotify";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import Track from "../components/track";
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import messages from "../messages";
import DownloadIcon from '@mui/icons-material/Download';
import { addSong, checkIfSongExist } from "../utils/spotifydb";
import { downloadSpotifySong } from "../utils/song-fetcher";

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const WelcomeBanner = styled.div`
    margin-top: 10px;
    width: 80vw;
    display: flex;
    justify-content: center;
`;

const TracksContainer = styled.div`
    margin-top: 2vh;
    width: 90%;
    height: 100%;
`;

const PlayControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
`;

const ButtonInnerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const TrackListItem = ({ data, index, style }: ListChildComponentProps<SpotifyTrack[]>) => {
    const track = data[index];
    const [_, setCurrentSongList] = useContext(CurrentSongListContext);

    return (
        <div 
            style={style} 
            onClick={() => setCurrentSongList({ index: 0, songs: [...data.slice(index), ...data.slice(0, index)] })}
            onContextMenu={(e) => {
                e.preventDefault();
                const songs = [...data.slice(index), ...data.slice(0, index)];
                songs[0] = {...track, force: true};
                setCurrentSongList({index: 0, songs});
            }}
        >
            <Track image={track.coverImg} name={track.name} artists={track.artistNames} id={track.id} />
        </div>
    )
}


const Tracks = ({ id, syncParentTracks }: { id: string, syncParentTracks: (newTracks: SpotifyTrack[]) => void }) => {
    const tracks = useSpotifyTrackData(id);

    useEffect(() => {
        // Jank way of syncing tracks state with parent component since suspense is to be kept local to this component only
        syncParentTracks(tracks);
    }, [tracks]);

    return (
        <TracksContainer>
            <AutoSizer>
                {({ height, width }) => (
                    <FixedSizeList
                        itemCount={tracks.length}
                        itemSize={85}
                        height={height}
                        width={width}
                        itemData={tracks}
                        itemKey={(index, data) => data[index].id}
                    >
                        {TrackListItem}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </TracksContainer>
    )
}

const getShuffledArr = <T,>(arr: T[]) => {
    const newArr = arr.slice()
    for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
    }
    return newArr
};


const Playlist = () => {
    const [currentPage, _] = useContext(CurrentPageContext);
    const [__, setCurrentSongList] = useContext(CurrentSongListContext);
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    if (!currentPage.options['id'] || !currentPage.options['name']) {
        return null;
    }

    const handlePlay = () => {
        if (tracks.length > 0) {
            setCurrentSongList({ index: 0, songs: tracks });
        }
    }

    const handleShufflePlay = () => {
        if (tracks.length > 0) {
            setCurrentSongList({ index: 0, songs: getShuffledArr(tracks) });
        }
    }

    const handleDownload = async () => {
        for (const track of tracks) {
            if (!(await checkIfSongExist(track.id))) {
                const songBlob = await downloadSpotifySong(track);
                await addSong({ spotify_id: track.id, songData: songBlob });
            }
        }
    }

    return (
        <BodyContainer>
            <WelcomeBanner>
                <Typography level="h1" noWrap>{currentPage.options['name']}</Typography>
            </WelcomeBanner>
            <PlayControlContainer>
                <IconButton variant="plain" onClick={handlePlay}>
                    <ButtonInnerContainer>
                        <PlayCircleIcon fontSize="large" />
                        <Typography level="body-sm">{messages.play}</Typography>
                    </ButtonInnerContainer>
                </IconButton>
                <IconButton variant="plain" onClick={handleShufflePlay}>
                    <ButtonInnerContainer>
                        <ShuffleIcon fontSize="large" />
                        <Typography level="body-sm">{messages.shufflePlay}</Typography>
                    </ButtonInnerContainer>
                </IconButton>
                <IconButton variant="plain" onClick={handleDownload}>
                    <ButtonInnerContainer>
                        <DownloadIcon fontSize="large" />
                        <Typography level="body-sm">{messages.download}</Typography>
                    </ButtonInnerContainer>
                </IconButton>
            </PlayControlContainer>
            <Suspense fallback={<ListLoadingShimmer count={5} />}>
                <Tracks id={currentPage.options['id']} syncParentTracks={(newTracks) => setTracks(newTracks)} />
            </Suspense>
        </BodyContainer>
    );
}

export default Playlist;