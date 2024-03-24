import { FC, useContext, useEffect } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";
import './Ingame.css'
import { AppContext } from "../../helpers/Context";
import { Coordinates, Player } from "../../models/Models";
import { getCurrentMatchByUserId, getListCoordinates } from '../../services/GameServices';
import { notification } from 'antd';
interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
  const { user, roomInfo, setStart, setMatchInfo, setWatchMode, setListCoordinates, setYourTurn } = useContext(AppContext);
  const [api, contextHolder] = notification.useNotification();
  useEffect(() => {
    if (roomInfo?.matchs?.length > 0) {
      getCurrentMatchInfo();
    }
  }, [roomInfo]);

  const getCurrentMatchInfo = async (): Promise<void> => {
    const match = await getCurrentMatchByUserId(user.id);
    if (match.isSuccess) {
      setMatchInfo(match.responseData);
    }
    const listCoordinates = await getListCoordinates(roomInfo?.matchs[0].matchId);
      if (listCoordinates.isSuccess) {
        setListCoordinates(listCoordinates.responseData);
        if (user.isPlaying) {
          const currentCoordinate = listCoordinates.responseData.find((lc: Coordinates) => lc.current === true);
          if (currentCoordinate) {
            if (currentCoordinate.userId === user?.id) {
              setYourTurn(false);
            } else {
              setYourTurn(true);
            }
          } else {
            if (user?.isRoomOwner === true) {
              setYourTurn(true);
            } else {
              setYourTurn(false);
            }
          }
          setStart(true);
        } else {
          setWatchMode(true);
        }
      } else {
        api.error({
          message: 'Connect Failed',
          description: "Cannot connect to server with error: " + listCoordinates.errorMessage,
          duration: -1,
          placement: "top"
        });
      }
  }
  return (
    <div className='in-game-container'>
      {contextHolder}
      <GameMenu />
      <GameGrid initialPlayer={user.isRoomOwner ? Player.PlayerO : Player.PlayerX} />
    </div>
  )
}

export default InGame;