import { Typography } from "@mui/joy";
import styled from "styled-components";
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import { memo, useEffect, useState } from "react";
import { checkIfSongExist } from '../utils/spotifydb';

interface TrackProps {
    id: string;
    name: string;
    artists: string[];
    image: string | undefined;
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    gap: 5px;
    &:hover {
        cursor: pointer;
    }
    &:active {
        transform: scale(0.95, 0.95);
    }
    user-select: none;
`;

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    width: 55vw;
`;

const DownloadIconContainer = styled.div`
    display: flex;
    margin-left: auto;
    align-items: center;
`

const Track = memo(({ image, name, artists, id }: TrackProps) => {
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

    useEffect(() => {
        checkIfSongExist(id).then((result) => setIsDownloaded(result));
    }, []);

    return (
        <Container>
            <img src={image} height={75} width={75} />
            <TextContainer>
                <Typography level="title-md" noWrap>{name}</Typography>
                <Typography level="body-sm" noWrap>{artists.join(', ')}</Typography>
            </TextContainer>
            {isDownloaded && 
                <DownloadIconContainer>
                    <DownloadDoneIcon color="success" />
                </DownloadIconContainer>
            }
        </Container>
    )
})

export default Track;