import styled from "styled-components";

interface ShimmerProps {
    width: string;
    height: string;
}

const ListContainer = styled.div`
    margin-top: 5vh;
    width: 90%;
    height: 100%;
`;

const ListShimmerContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`

const ShimmerContainer = styled.div<{ height: string, width: string }>`
    @keyframes shimmer {
        100% {
            mask-position: left
        }
    }

    background-color: lightgray;
    display: inline-block;
    mask: linear-gradient(-60deg, #000 30%, #0005, #000 70%) right/350% 100%;
    animation: shimmer 2.5s infinite;
    width: ${props => props.width};
    height: ${props => props.height};
    border-radius: 5px;
`;

const Shimmer = (props: ShimmerProps) => (
    <ShimmerContainer {...props} />
);

export const ListLoadingShimmer = ({ count } : { count: number }) => (
    <ListContainer>
        <ListShimmerContainer>
            {[...Array(count).keys()].map(() => <Shimmer width="50vw" height="75px" />)}
        </ListShimmerContainer>
    </ListContainer>
);

export default Shimmer;