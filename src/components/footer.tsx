import styled from "styled-components";
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Typography } from "@mui/joy";
import { ReactNode, useContext } from "react";
import messages from "../messages";
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import { CurrentPageContext, Route } from "../contexts";

interface FooterOptionProps {
    icon: ReactNode;
    text: string;
    page: Route;
}

const PageContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    width: 100%;
    height: 8vh;
`;

const CellContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
`;

const IconButtonContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const footerOptions: FooterOptionProps[] = [
    {
        icon: <HomeIcon fontSize="large" />,
        text: messages.home,
        page: { page: 'home'},
    },
    {
        icon: <SearchIcon fontSize="large" />,
        text: messages.search,
        page: { page: 'search'},
    },
    {
        icon: <SettingsIcon fontSize="large" />,
        text: messages.settings,
        page: { page: 'settings'},
    },
]

const FooterOption = ({ icon, text, page }: FooterOptionProps) => {
    const [_, setCurrentPage] = useContext(CurrentPageContext);

    return (
        <CellContainer>
            <IconButton onClick={() => setCurrentPage(page)}>
                <IconButtonContentContainer>
                    {icon}
                    <Typography>{text}</Typography>
                </IconButtonContentContainer>
            </IconButton>
        </CellContainer>
    );
};

const Footer = () => (
    <PageContainer>
        {footerOptions.map((option) => <FooterOption {...option} />)}
    </PageContainer>
)

export default Footer;