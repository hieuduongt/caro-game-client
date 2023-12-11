import { FC } from "react";

interface RoomListProps extends React.HTMLAttributes<HTMLDivElement> {

}

const RoomList: FC<RoomListProps> = (props) => {
    return (
        <div className='in-room-container'>
            Room list
        </div>
    )
}

export default RoomList;