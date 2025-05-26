import { Alert, AlertProps, IconButton } from "@mui/joy";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { ReactNode, useState } from "react";

interface DismissableAlertProps {
    variant?: AlertProps['variant'];
    color?: AlertProps['color'];
    secondaryAction?: ReactNode;
    message: string;
}

const DismissableAlert = ({ secondaryAction, variant, color, message }: DismissableAlertProps) => {
    const [isShown, setIsShown] = useState<boolean>(true);

    if (isShown) {
        return (
            <Alert
                variant={variant ?? "soft"}
                color={color ?? "warning"}
                endDecorator={
                    <>
                        {secondaryAction}
                        <IconButton size="sm" onClick={() => setIsShown(false)}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </>
                }
            >
                {message}
            </Alert>
        )
    }
    return null;
}

export default DismissableAlert;