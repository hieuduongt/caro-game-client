import React, { FC, useContext, useEffect, useState } from 'react';
import './GameGrid.css';
import { AppContext } from '../../helpers/Context';
import { checkWinner } from '../../helpers/Helper';
import { FaRegCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { Coordinates, GameDTO, Player, UserInMatches } from '../../models/Models';
import { finishGame, getListCoordinates, move, updateWinPoints } from '../../services/GameServices';

interface GameGridProps extends React.HTMLAttributes<HTMLDivElement> {
    initialPlayer: Player;
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
    const { connection, matchInfo, user, listCoordinates, setListCoordinates, yourTurn, setYourTurn, start, newGame } = useContext(AppContext);
    const { initialPlayer } = props;
    const [player, setPlayer] = useState<Player>();
    const [isWinner, setIsWinner] = useState<boolean>();
    const [gameBoard, setGameBoard] = useState<Array<Array<Coordinates>>>([[]]);

    const initGameBoard = (listCoordinates: Coordinates[]): void => {
        const arr = [];
        for (let i = 0; i < 20; i++) {
            arr[i] = new Array<Coordinates>();
            for (let j = 0; j < 40; j++) {
                arr[i][j] = {
                    userId: "",
                    player: "",
                    x: j,
                    y: i,
                    current: false,
                    winPoint: false
                };
            }
        }
        if (listCoordinates && listCoordinates.length) {
            for (let i = 0; i < listCoordinates.length; i++) {
                const coordinates = listCoordinates[i];
                arr[coordinates.x][coordinates.y] = {
                    userId: coordinates.userId,
                    player: coordinates.player,
                    x: coordinates.x,
                    y: coordinates.y,
                    current: coordinates.current,
                    winPoint: coordinates.winPoint
                }
            }
        }
        setGameBoard(arr);
    }

    const updateGameBoard = (x: number, y: number, userId: string, player: Player | string, id?: string, current?: boolean, winPoint?: boolean): void => {
        setGameBoard(gameBoard => {
            const newBoard = [...gameBoard];
            newBoard.find(nb => nb.find(c => c.current === true))?.forEach(cc => {
                if (cc.current === true) {
                    cc.current = false;
                }
            });
            newBoard[x][y] = {
                id: id,
                userId: userId,
                player: player,
                x: x,
                y: y,
                current: current || false,
                winPoint: winPoint || false
            }
            return newBoard;
        });
    }

    const switchTurn = (data: Coordinates): void => {
        updateGameBoard(data.x, data.y, data.userId, data.player, data.id, true);
        setYourTurn(true);
    }

    const getCoordinates = async (matchId: string): Promise<void> => {
        const listCoordinates = await getListCoordinates(matchId);
        if (listCoordinates.isSuccess) {
            setListCoordinates(listCoordinates.responseData);
            initGameBoard(listCoordinates.responseData);
        }
    }

    useEffect(() => {
        connection.on("UpdateTurn", (data: Coordinates) => {
            switchTurn(data);
        });
        connection.on("Loser", async (matchId: string): Promise<void> => {
            getCoordinates(matchId);
            setIsWinner(false);
        });
        connection.on("Winner", async (): Promise<void> => {
            setIsWinner(true);
        });
    }, []);

    useEffect(() => {
        initGameBoard(listCoordinates);
    }, [listCoordinates]);

    useEffect(() => {
        initGameBoard([]);
    }, [newGame]);
    
    useEffect(() => {
        setPlayer(initialPlayer);
    }, [initialPlayer]);

    const handleClick = async (e: any, x: number, y: number): Promise<void> => {
        // check if the cell is already clicked -> stop the logic
        if(!yourTurn) return;
        if (player !== initialPlayer) return;
        if (!e || !e.target || e.target.nodeName.toLowerCase() !== "td") return;
        if (e.target.getAttribute("custom-selected")) return;

        const coordinates: Coordinates = {
            x: x,
            y: y,
            player: player,
            userId: user.id
        }
        const competitor = matchInfo.userInMatches.find((uim: UserInMatches) => uim.id !== user.id);
        const gameData: GameDTO = {
            competitorId: competitor.id,
            Coordinates: coordinates,
            matchId: matchInfo.matchId,
            roomId: matchInfo.roomId
        }
        const res = await move(gameData);
        if (res && res.isSuccess) {
            connection.invoke("PauseCountdown", matchInfo.matchId, user.id);
            connection.invoke("ResumeCountdown", matchInfo.matchId, competitor.id);
            updateGameBoard(res.responseData.x, res.responseData.y, res.responseData.userId, res.responseData.player, res.responseData.id, res.responseData.current, res.responseData.winPoint);
            setYourTurn(false);
        }

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

            const winPointUpdateing = await updateWinPoints(winner.listCoordinates);
            if (winPointUpdateing.isSuccess) {
                winner.listCoordinates.forEach(lc => {
                    updateGameBoard(lc.x, lc.y, user.id, player, lc.id, false, true);
                });
            }
            const res = await finishGame(matchInfo);
            if (res.isSuccess) {
                connection.invoke("StopMatch", matchInfo.matchId);
            }
        }
    }

    return (
        <div className='game-grid'>
            <div className='game-table-overlay' style={{ opacity: start ? 0 : 1, visibility: start ? "hidden" : "visible", color: isWinner ? "#00fd00" : "#ff0000" }}>
                {isWinner === undefined ? "" : isWinner === true ? "You Win!" : "You Lose!"}
            </div>
            <div className="game-table">
                <table>
                    <tbody>
                        {
                            gameBoard.map((itemY: Array<Coordinates>, y: number) => (
                                <tr key={y}>
                                    {
                                        itemY.map((itemX: Coordinates, x: number) => (
                                            <td
                                            key={`${y}, ${x}`}
                                            className={`${itemX.winPoint ? "win" : ""} ${itemX.current && user.id !== itemX.userId ? "current" : ""}`}
                                            onClick={(e) => handleClick(e, y, x)}
                                            custom-coordinates={`${y}, ${x}`}
                                            custom-selected={itemX.userId? true : false}
                                            style={{cursor: yourTurn ? "pointer" : "not-allowed"}}
                                            >
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