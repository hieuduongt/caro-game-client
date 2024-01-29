import React, { FC, useContext, useEffect, useState } from 'react';
import './GameGrid.css';
import { InGameContext, UserContext } from '../../helpers/Context';
import { checkWinner } from '../../helpers/Helper';
import { FaRegCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { GameDTO, Player, ReceiveCoordinates, UserInMatches } from '../../models/Models';
import { finishGame, move } from '../../services/GameServices';

interface GameGridProps extends React.HTMLAttributes<HTMLDivElement> {
    initialPlayer: Player;
}

export interface CellValue {
    userId: string;
    icon: Player | string;
    x: number;
    y: number;
}

const playerIcons = [
    {
        playerName: Player.PlayerX,
        icon: <MdClose size={28} color='blue' />
    },
    {
        playerName: Player.PlayerO,
        icon: <FaRegCircle size={20} color='red' />
    }
]

const GameGrid: FC<GameGridProps> = (props) => {
    const { start, setStart } = useContext(InGameContext);
    const { connection, roomInfo, matchInfo, user } = useContext(UserContext);
    const { initialPlayer } = props;
    const [gameBoard, setGameBoard] = useState<Array<Array<CellValue>>>([[]]);
    const [player, setPlayer] = useState<Player>();
    const [isWinner, setIsWinner] = useState<string>("");

    const resetGameBoard = (): void => {
        const arr = [];
        for (let i = 0; i < 20; i++) {
            arr[i] = new Array<CellValue>();
            for (let j = 0; j < 40; j++) {
                arr[i][j] = {
                    userId: "",
                    icon: "",
                    x: j,
                    y: i
                };
            }
        }
        setStart(false);
        setGameBoard(arr);
        setIsWinner("");
    }

    const updateGameBoard = (x: number, y: number, userId: string, icon: Player): void => {
        setGameBoard((gameBoard) => {
            const newBoard = [...gameBoard];
            newBoard[x][y] = {
                userId: userId,
                icon: icon,
                x: x,
                y: y
            }
            return newBoard;
        });
    }

    const switchTurn = (data: ReceiveCoordinates): void => {
        console.log("hhhhhhhh")
        document.querySelector(".current")?.classList.remove("current");
        updateGameBoard(data.x, data.y, data.userId, data.player);
        document.querySelector(`[custom-coordinates="${data.x}, ${data.y}"]`)?.classList.add("current");
    }

    useEffect(() => {
        resetGameBoard();
        connection.on("UpdateTurn", (data: ReceiveCoordinates) => {
            console.log(data);
            switchTurn(data);
        });
    }, []);

    useEffect(() => {
        setPlayer(initialPlayer);
    }, [initialPlayer]);

    const handleClick = async (e: any, x: number, y: number): Promise<void> => {
        // check if the cell is already clicked -> stop the logic
        if (player !== initialPlayer) return;
        if (!e || !e.target || e.target.nodeName.toLowerCase() !== "td") return;
        if (e.target.getAttribute("selected")) return;
        // if the cell is available -> fill the icon and do the logic
        document.querySelector(".current")?.classList.remove("current");
        updateGameBoard(x, y, user.id, player);
        e.target.setAttribute("selected", "true");
        const winner = checkWinner(gameBoard, x, y, user.id);
        if (winner.winner) {
            matchInfo.userInMatches.forEach((u: UserInMatches) => {
                if (u.id === user.id) {
                    u.isWinner = true;
                } else {
                    u.isWinner = false;
                }
                delete u.time;
            });
            const res = await finishGame(matchInfo);
            if (res.isSuccess) {
                connection.invoke("StopMatch", matchInfo.matchId);
            }
            updateGameBoard(x, y, user.id, player);
        } else {
            const coordinates: ReceiveCoordinates = {
                x: x,
                y: y,
                player: player,
                userId: user.id
            }
            const competitor = matchInfo.userInMatches.find((uim: UserInMatches) => uim.id !== user.id);
            const gameData: GameDTO = {
                competitorConnectionId: competitor.connectionId,
                competitorId: competitor.id,
                ReceiveCoordinates: coordinates,
                matchId: matchInfo.matchId,
                roomId: matchInfo.roomId
            }
            const res = await move(gameData);
            if (res && res.isSuccess) {
                connection.invoke("PauseCountdown", matchInfo.matchId, user.id);
                connection.invoke("ResumeCountdown", matchInfo.matchId, competitor.id);
            }
        }
    }

    return (
        <div className='game-grid'>
            {/* <div className='game-table-overlay' style={{ opacity: start ? 0 : 1, visibility: start ? "hidden" : "visible", color: isWinner === "you" ? "green" : "red" }}>
                {isWinner === "you" ? "You Win!" : isWinner === "competitor" ? "You Lose!" : ""}
            </div> */}
            <div className="game-table">
                <table>
                    <tbody>
                        {
                            gameBoard.map((itemY, y) => (
                                <tr key={y}>
                                    {
                                        itemY.map((itemX, x) => (
                                            <td key={`${y}, ${x}`} onClick={(e) => handleClick(e, y, x)} custom-coordinates={`${y}, ${x}`}>
                                                {
                                                    playerIcons.find(it => it.playerName === itemX.icon)?.icon
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