import { Button, Typography } from "@mui/joy";
import messages from "../messages";
import styled from "styled-components";
import { useAsync } from "../hooks/use-async";
import { isBeforeInstallPromptSupported, registerAndCheckServiceWorker } from "../utils/pwa";
import { useContext } from "react";
import { CurrentPageContext } from "../contexts";
import { setLocalStorageItem } from "../utils/localstorage";
import { PWA_PREFERENCE } from "../constants";

interface InstallationScreenProps {
    deferPrompt: any;
}

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-top: 50px;
`;

const BodyContainer = styled.div`
    width: '80%';
`;

const InstallationScreen = ({ deferPrompt }: InstallationScreenProps) => {
    const isServiceWorkerResponse = useAsync<void>(registerAndCheckServiceWorker);
    const [_, setCurrentPage] = useContext(CurrentPageContext);

    const handleWeb = () => {
        setLocalStorageItem(PWA_PREFERENCE, 'web');
        setCurrentPage({ page: 'login'});
    }

    const handleInstall = async () => {
        if (deferPrompt !== undefined) {
            deferPrompt.prompt();
            const { outcome } = await deferPrompt.userChoice;
            if (outcome === 'accepted') {
                setLocalStorageItem(PWA_PREFERENCE, 'pwa');
                alert(messages.pwaInstallSuccess);
                setCurrentPage({ page: 'login'});
            }
            return;
        }
        console.error("Defer prompt object is undefined");
    }

    if (isServiceWorkerResponse.state === 'error') {
        alert(isServiceWorkerResponse.error.message);
        setCurrentPage({ page: 'login'});
        return null;
    }

    return (
        <PageContainer>
            <Typography level="h1">Spotify Listener</Typography>
            <BodyContainer>
                <Typography>{messages.installScreenBody}</Typography>
            </BodyContainer>
            <Button disabled={!isBeforeInstallPromptSupported() || deferPrompt === undefined} onClick={handleInstall}>
                {isBeforeInstallPromptSupported() ? messages.installApp : messages.manualInstallApp}
            </Button>
            <Button variant="plain" onClick={handleWeb}>{messages.continueViaWeb}</Button>
        </PageContainer>
    )
}

export default InstallationScreen;