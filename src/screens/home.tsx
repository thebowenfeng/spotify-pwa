import styled from "styled-components";
import { Typography } from "@mui/joy";
import messages from "../messages";
import { SpotifyPlaylist, useSpotifyAccountData, useSpotifyPlaylistsData } from "../hooks/spotify";
import Playlist from "../components/playlist";
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import { Suspense, useContext } from "react";
import { ListLoadingShimmer } from "../components/shimmer";
import { CurrentPageContext } from "../contexts";

const BodyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const WelcomeBanner = styled.div`
    margin-top: 10px;
`;

const PlaylistContainer = styled.div`
    margin-top: 5vh;
    width: 90%;
    height: 100%;
`;

const PlaylistListItem = ({ data, index, style }: ListChildComponentProps<SpotifyPlaylist[]>) => {
    const playlist = data[index];
    const [_, setPage] = useContext(CurrentPageContext);

    return (
        <div style={style} onClick={() => setPage({ page: 'playlist', options: { id: playlist.id, name: playlist.name } })}>
            <Playlist image={playlist.image} name={playlist.name} ownerName={playlist.ownerName} />
        </div>
    )
}

const Playlists = () => {
    const playlists = useSpotifyPlaylistsData();

    return (
        <PlaylistContainer>
            <AutoSizer>
                {({ height, width }) => (
                    <FixedSizeList
                        itemCount={playlists.length}
                        itemSize={85}
                        height={height}
                        width={width}
                        itemData={playlists}
                        itemKey={(index, data) => data[index].id}
                    >
                        {PlaylistListItem}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </PlaylistContainer>
    )
}

const Home = () => {
    const userInfo = useSpotifyAccountData();

    return (
        <BodyContainer>
            <WelcomeBanner>
                <Typography level="h1">{`${messages.welcome}${userInfo.name}!`}</Typography>
            </WelcomeBanner>
            <Suspense fallback={<ListLoadingShimmer count={5} />}>
                <Playlists />
            </Suspense>
        </BodyContainer>
    );
}

export default Home;