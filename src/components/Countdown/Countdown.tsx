import { FC, useEffect, useState } from "react";

interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
    time: number;
    pause: boolean;
    onTimesUp?: () => void;
}

const Countdown: FC<CountdownProps> = (props) => {
    const { time, pause, style, onTimesUp } = props;
    const [seconds, setSeconds] = useState<number>(time);
    useEffect(() => {
        setSeconds(time);
    },[time]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (pause === false && seconds > 0) {
                setSeconds(seconds - 1);
            }
            if (seconds == 0) {
                if (onTimesUp) onTimesUp();
                clearInterval(interval);
                return;
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds, pause]);
    return (
        <div style={{ ...style }}>
            {
                `${Math.floor(seconds / 60)}:${seconds % 60}`
            }
        </div>
    )
}

export default Countdown;