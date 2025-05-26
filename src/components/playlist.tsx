import { Typography } from "@mui/joy";
import styled from "styled-components";

interface PlaylistProps {
    name: string;
    ownerName: string;
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
    width: 65vw;
`

const Playlist = ({ image, name, ownerName }: PlaylistProps) => {
    return (
        <Container>
            <img src={image} height={75} width={75} />
            <TextContainer>
                <Typography level="title-md" noWrap>{name}</Typography>
                <Typography level="body-sm" noWrap>{ownerName}</Typography>
            </TextContainer>
        </Container>
    )
}

export default Playlist;