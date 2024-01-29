import { FC, useContext, useEffect, useState } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";
import './Ingame.css'
import { InGameContext, UserContext } from "../../helpers/Context";
import { Player } from "../../models/Models";
interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
  const { user, connection } = useContext(UserContext);
  const [start, setStart] = useState<boolean>(true);
  useEffect(() => {
    if(user && user.isPlaying) {
      // connection.invoke("GetCurrentMatch", user.id, user.connectionId);
      setStart(true);
    }
  }, [user])
  return (
    <div className='in-game-container'>
      <InGameContext.Provider value={{start, setStart}}>
        <GameMenu />
        <GameGrid initialPlayer={user.isRoomOwner ? Player.PlayerO : Player.PlayerX}/>
      </InGameContext.Provider>
    </div>
  )
}

export default InGame;