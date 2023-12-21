import { FC, useState } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";
import './Ingame.css'
import { InGameContext } from "../../helpers/Context";
interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
  const [start, setStart] = useState<boolean>(false);
  return (
    <div className='in-game-container'>
      <InGameContext.Provider value={{start, setStart}}>
        <GameMenu />
        <GameGrid initialPlayer={"playerX"} foundWinner={(winner, reset) => { console.log(winner); }} lengthX={40} lengthY={20} onclick={() => { }} />
      </InGameContext.Provider>
    </div>
  )
}

export default InGame;