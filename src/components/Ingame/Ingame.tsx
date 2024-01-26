import { FC, useContext, useEffect, useState } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";
import './Ingame.css'
import { InGameContext, UserContext } from "../../helpers/Context";
interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
  const { user} = useContext(UserContext);
  const [start, setStart] = useState<boolean>(false);
  useEffect(() => {
    if(user && user.isPlaying) {
      setStart(true);
    }
  }, [user])
  return (
    <div className='in-game-container'>
      <InGameContext.Provider value={{start, setStart}}>
        <GameMenu />
        <GameGrid initialPlayer={"playerX"}/>
      </InGameContext.Provider>
    </div>
  )
}

export default InGame;