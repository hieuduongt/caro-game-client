import { FC, useContext, useEffect } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";
import './Ingame.css'
import { AppContext } from "../../helpers/Context";
import { Player } from "../../models/Models";
interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
  const { user, matchInfo, setStart } = useContext(AppContext);
  useEffect(() => {
    if ((user && user.isPlaying) || matchInfo) {
      setStart(true);
    }
  }, [user]);
  return (
    <div className='in-game-container'>
      <GameMenu />
      <GameGrid initialPlayer={user.isRoomOwner ? Player.PlayerO : Player.PlayerX} />
    </div>
  )
}

export default InGame;