import React, { FC, useContext, useEffect, useState } from 'react';
import './GameGrid.css';
import { PlayerContext } from '../../helpers/Context';
import { checkWinner } from '../../helpers/Helper';
import { FaRegCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";

interface GameGridProps extends React.HTMLAttributes<HTMLDivElement> {
    lengthX: number;
    lengthY: number;
    onclick: (x: number, y: number, player: string) => void;
    update?: CellValue;
    initialPlayer: string;
    foundWinner: (winner: string | undefined, reset: () => void) => void;
}

export interface CellValue {
    player: string;
    className: string;
    x: number;
    y: number;
}

const playerIcons = [
    {
        playerName: "playerX",
        icon: <MdClose size={28} color='blue' />
    },
    {
        playerName: "playerO",
        icon: <FaRegCircle size={20} color='red' />
    }
]

const GameGrid: FC<GameGridProps> = (props) => {
    const { lengthX, lengthY, onclick, update, initialPlayer, foundWinner } = props;
    const [currentActiveCell, setCurrentActiveCell] = useState<CellValue>();
    const [gameBoard, setGameBoard] = useState<Array<Array<CellValue>>>([[]]);
    const [player, setPlayer] = useContext(PlayerContext);
    const [isStopping, setIsStopping] = useState<boolean>(false);
    const [isWinner, setIsWinner] = useState<boolean>(false);

    const resetGameBoard = (): void => {
        const arr = [];
        for (let i = 0; i < lengthY; i++) {
            arr[i] = new Array<CellValue>();
            for (let j = 0; j < lengthX; j++) {
                arr[i][j] = {
                    player: "",
                    className: "",
                    x: j,
                    y: i
                };
            }
        }
        setIsStopping(false);
        setGameBoard(arr);
    }

    const updateGameBoard = (x: number, y: number, className: string, listCoordinates?: CellValue[]): void => {
        const newBoard = [...gameBoard];
        if (listCoordinates?.length) {
            listCoordinates.forEach(it => {
                newBoard[it.x][it.y] = {
                    player: player,
                    className: className,
                    x: it.x,
                    y: it.y
                }
            });
        } else {
            newBoard[x][y] = {
                player: player,
                className: className,
                x: x,
                y: y
            }
        }
        setGameBoard(newBoard);
    }

    const switchTurn = (): void => {
        if (currentActiveCell?.x) {
            updateGameBoard(currentActiveCell.x, currentActiveCell.y, "");
        }
        updateGameBoard(update!.x, update!.y, "current");
        const winner = checkWinner(gameBoard, update!.x, update!.y, initialPlayer);
        if (winner.winner) {
            updateGameBoard(update!.x, update!.y, "win", winner.listCoordinates);
            setIsStopping(true);
            setIsWinner(false);
            foundWinner(winner.winner, resetGameBoard);
        } else {
            setPlayer(initialPlayer === "playerX" ? "playerO" : "playerX");
            onclick(update!.x, update!.y, player);
        }
        setCurrentActiveCell(update);
    }

    useEffect(() => {
        if (update) {
            switchTurn();
        }
    }, [update]);

    useEffect(() => {
        resetGameBoard();
    }, [lengthX, lengthY]);

    const handleClick = (e: any, x: number, y: number): any => {
        // check if the cell is already clicked -> stop the logic
        if(player !== initialPlayer) return;
        if (!e || !e.target || e.target.nodeName.toLowerCase() !== "td") return;
        if (e.target.getAttribute("selected")) return;
        // if the cell is available -> fill the icon and do the logic
        document.querySelector(".current")?.classList.remove("current");
        updateGameBoard(x, y, "");
        e.target.setAttribute("selected", "true");
        const winner = checkWinner(gameBoard, x, y, initialPlayer);
        if (currentActiveCell?.x) {
            updateGameBoard(currentActiveCell.x, currentActiveCell.y, "");
        }
        if (winner.winner) {
            updateGameBoard(x, y, "win", winner.listCoordinates);
            setIsStopping(true);
            setIsWinner(true);
            foundWinner(winner.winner, resetGameBoard);
        } else {
            setPlayer(initialPlayer === "playerX" ? "playerO" : "playerX");
            onclick(x, y, player);
        }
    }

    return (
        <div className='game-grid'>
            <div className='game-table-overlay' style={{ opacity: isStopping ? 1 : 0, visibility: isStopping ? "visible" : "hidden", color: isWinner ? "green" : "red" }}>
                You Win!
            </div>
            <div className="game-table">
                <table>
                    <tbody>
                        {
                            gameBoard.map((itemY, y) => (
                                <tr key={y}>
                                    {
                                        itemY.map((itemX, x) => (
                                            <td key={`${y}, ${x}`} onClick={(e) => handleClick(e, y, x)} className={itemX.className} custom-coordinates={`${y}, ${x}`}>
                                                {
                                                    playerIcons.find(it => it.playerName === itemX.player)?.icon
                                                }
                                            </td>
                                        ))
                                    }
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>

    );
}

export default GameGrid;