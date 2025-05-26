import { Button, Checkbox, Typography } from "@mui/joy";
import messages from "../messages";
import styled from "styled-components";
import { ChangeEvent, useState } from "react";
import { requestSpotifyAuth } from "../utils/auth";
import { deleteLocalStorageItem, setLocalStorageItem } from "../utils/localstorage";
import { REMEMBER_ME } from "../constants";

const PageContainer = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-template-rows: 1fr 1fr 1fr;
    height: 100%;
`;

const TitleContainer = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 50px;
    height: 200px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
`

const AbsolutePositionContainer = styled.div`
    position: absolute;
    bottom: 50px;
`

const Login = () => {
    const [isLoginDisabled, setIsLoginDisabled] = useState<boolean>(false);

    const handleLogin = () => {
        setIsLoginDisabled(true);
        requestSpotifyAuth();
    }

    const handleRememberMe = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setLocalStorageItem(REMEMBER_ME, 'true');
            return;
        }
        deleteLocalStorageItem(REMEMBER_ME);
    }

    return (
        <PageContainer>
            <TitleContainer>
                <Typography level="h1">{messages.spotifyLoginButton}</Typography>
            </TitleContainer>
            <ButtonContainer>
                <Button 
                    size="lg"
                    disabled={isLoginDisabled}
                    onClick={handleLogin}
                    startDecorator={<img src="https://static-00.iconduck.com/assets.00/spotify-icon-512x512-l4zex9yc.png" role="none" width={24} height={24} />}
                >
                    {messages.spotifyLoginButton}
                </Button>
                <AbsolutePositionContainer>
                    <Checkbox label={messages.rememeberMe} onChange={handleRememberMe} />
                </AbsolutePositionContainer>
            </ButtonContainer>
            <div />
        </PageContainer>
    )
}

export default Login;