import { CircularProgress } from "@mui/joy";
import styled from "styled-components";

const PageContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

const PageLoadingSpinner = () => (
    <PageContainer>
        <CircularProgress size="lg" />
    </PageContainer>
)

export default PageLoadingSpinner;