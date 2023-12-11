import { FC } from "react";
import GameGrid from "../GameGrid/GameGrid";
import GameMenu from "../GameMenu/GameMenu";

interface InGameProps extends React.HTMLAttributes<HTMLDivElement> {

}

const InGame: FC<InGameProps> = (props) => {
    return (
        <div className='game-container'>
        <GameMenu />
        <GameGrid initialPlayer={"playerX"} foundWinner={(winner, reset) => { console.log(winner); }} lengthX={40} lengthY={20} onclick={() => { }} />
      </div>
    )
}

export default InGame;