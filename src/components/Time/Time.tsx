import { FC } from "react";

interface TimeProps extends React.HTMLAttributes<HTMLDivElement> {
    time: number;
}

const Time: FC<TimeProps> = (props) => {
    const { time, style } = props;
    return (
        <div style={{ ...style }}>
            {
                `${Math.floor(time / 60)}:${time % 60}`
            }
        </div>
    )
}

export default Time;