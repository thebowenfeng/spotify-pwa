import messages from "../messages";
import { debugLog } from "./logging";

export const registerAndCheckServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            const newRegistration = await navigator.serviceWorker.register('sw.js');
            if (!newRegistration) {
                throw Error(messages.cantRegisterSw);
            }
            debugLog('successfully registered SW');
            return;
        }
        debugLog('service worker already registered');
        return;
    }
    throw Error(messages.noSwAPI);
}

export const isBeforeInstallPromptSupported = () => 'BeforeInstallPromptEvent' in window;

// @ts-ignore navigator.standalone is not standard web API, only works on iOS hence type error
export const isRunningPwa = () => navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
