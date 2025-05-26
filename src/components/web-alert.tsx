import {  Button } from "@mui/joy";
import { PWA_PREFERENCE } from "../constants";
import { getLocalStorageItem } from "../utils/localstorage";
import { isRunningPwa } from "../utils/pwa";
import messages from "../messages";
import { useContext } from "react";
import { CurrentPageContext } from "../contexts";
import DismissableAlert from "./dismissable-alert";

const WebWarning = () => {
    const [_, setCurrentPage] = useContext(CurrentPageContext);

    if (!isRunningPwa() && getLocalStorageItem(PWA_PREFERENCE) === 'pwa') {
        return (
            <DismissableAlert
                secondaryAction={<Button variant="outlined" color="warning" onClick={() => setCurrentPage({ page: "install"})}>{messages.reinstallApp}</Button>}
                message={messages.runningInWebWarning}
            />
        )
    }
    return null;
}

export default WebWarning;