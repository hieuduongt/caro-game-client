import { FC, useContext, useEffect, useRef, useState } from 'react';
import './GameMenu.css';
import { Button, Form, Input, Flex, notification, Tooltip } from 'antd';
import { AiOutlineSend } from "react-icons/ai";
import { InGameContext, StepContext, UserContext } from '../../helpers/Context';
import { MatchDTO, Message, RoomDTO, UserDTO } from '../../models/Models';
import { getRoom, leaveRoom } from '../../services/RoomServices';
import { updateUserSlot } from '../../services/UserServices';
import { finishGame, startGame } from '../../services/GameServices';
import Time from '../Time/Time';

interface GameMenuProps extends React.HTMLAttributes<HTMLDivElement> {

}

enum Turn {
    You,
    Competitor
}

const GameMenu: FC<GameMenuProps> = (props) => {
    const { connection, roomInfo, setRoomInfo, user, setUser, matchInfo, setMatchInfo } = useContext(UserContext);
    const { start, setStart } = useContext(InGameContext);
    const [step, setStep] = useContext(StepContext);
    const [guest, setGuest] = useState<UserDTO>();
    const [messages, setMessages] = useState<Message[]>();
    const [turn, setTurn] = useState<Turn>(user.isRoomOwner ? Turn.You : Turn.Competitor);
    const [pause, setPause] = useState<boolean>(false);
    const [roomOwnerTime, setRoomOwnerTime] = useState<number>(0);
    const [competitorTime, setCompetitorTime] = useState<number>(0);
    const cLoaded = useRef<boolean>(false);
    const [api, contextHolder] = notification.useNotification();

    const getRoomInfo = async (): Promise<void> => {
        if (user.roomId !== "" && user.roomId !== null && user.roomId !== undefined) {
            const currentRoom = await getRoom(user.roomId);
            if (currentRoom.isSuccess) {
                setRoomInfo(currentRoom.responseData);
                const guest = currentRoom.responseData.members!.find((m: UserDTO) => m.sitting && !m.isRoomOwner);
                if (guest) {
                    setGuest(guest);
                } else {
                    setGuest(undefined);
                }
            }
        }
    }

    useEffect(() => {
        getRoomInfo();
        if(user.isPlaying) {
            getCurrentMatch();
        }
    }, [user]);

    const getCurrentMatch = () => {
        connection.invoke("GetCurrentMatch", user.id, user.connectionId);
    }

    useEffect(() => {
        if (cLoaded.current) return;

        connection.on("UserLeaved", async (userName: string): Promise<void> => {
            setMessages((prev) => {
                const newMess: Message[] = prev && prev?.length ? [...prev] : [];
                const mess: Message = {
                    userId: user.id,
                    userName: "",
                    isMyMessage: false,
                    message: `${userName} Leaved`
                }
                newMess.push(mess);
                return newMess;
            });
            await getRoomInfo();
        });

        connection.on("UserSitted", async (): Promise<void> => {
            await getRoomInfo();
        });

        connection.on("StartMessage", async (): Promise<void> => {
            setMessages((prev) => {
                const newMess: Message[] = prev && prev?.length ? [...prev] : [];
                const mess: Message = {
                    userId: user.id,
                    userName: "",
                    isMyMessage: false,
                    message: `game started!!!`
                }
                newMess.push(mess);
                return newMess;
            });
        });

        connection.on("UserJoined", async (userName: string): Promise<void> => {
            setMessages((prev) => {
                const newMess: Message[] = prev && prev?.length ? [...prev] : [];
                const mess: Message = {
                    userId: user.id,
                    userName: "",
                    isMyMessage: false,
                    message: `${userName} joined`
                }
                newMess.push(mess);
                return newMess;
            });
            await getRoomInfo();
        });

        connection.on("RoomOwnerChanged", async (id: string): Promise<void> => {
            changeOwner(id);
            await getRoomInfo();
        });

        connection.on("RoomClosedGroup", (): void => {
            onRoomClosed();
        });

        connection.on("MatchStarted", (match: MatchDTO): void => {
            setMatchInfo(match);
            setStart(true);
        });

        connection.on("TimeUpdate", (time: number, userId: string, isRoomOwner: boolean): void => {;
            if (isRoomOwner) {
                setRoomOwnerTime(time);
            } else {
                setCompetitorTime(time);
            }
        });

        connection.on("TimesUp", async (match: MatchDTO, loseUserId: string): Promise<void> => {
            await handleWhenTimesUp(match, loseUserId);
        });

        connection.on("FinishMessage", async (result: boolean): Promise<void> => {
            if (result) {
                api.success({
                    message: 'Info',
                    description: "You win",
                    duration: 5,
                    placement: "top"
                });
            } else {
                api.info({
                    message: 'Info',
                    description: "You lose",
                    duration: 5,
                    placement: "top"
                });
            }
            await getRoomInfo();
            setStart(false);
        });

        connection.on("FinishMessageGroup", async (): Promise<void> => {
            await getRoomInfo();
            setStart(false);
        });

        connection.on("CurrentMatch", async (match: MatchDTO): Promise<void> => {
            console.log(match);
            setMatchInfo(match);
            setRoomOwnerTime(match.userInMatches.find(u => u.isRoomOwner)?.timeLeft || 300);
            setCompetitorTime(match.userInMatches.find(u => !u.isRoomOwner)?.timeLeft || 300);
        });
        cLoaded.current = true;
    }, [user]);

    const onRoomClosed = (): void => {
        const newUser: UserDTO = user;
        newUser.roomId = "";
        newUser.sitting = false;
        newUser.isRoomOwner = false;
        setUser(newUser);
        setRoomInfo(undefined);
        setStep(2);
    }

    const handleWhenTimesUp = async (match: MatchDTO, loseUserId: string): Promise<void> => {
        if (user.isRoomOwner) {
            match.userInMatches.forEach(u => {
                if(u.id !== loseUserId) {
                    u.isWinner = true;
                } else {
                    u.isWinner = false;
                }
                delete u.time;
            });
            const res = await finishGame(match);
            if(res.isSuccess) {
                connection.invoke("StopMatch", match.matchId);
            }
        }
        await getRoomInfo();
        setStart(false);
    }

    const changeOwner = (id: string): void => {
        if (id === user.id) {
            api.info({
                message: 'Info',
                description: "the Room owner is quit, now you are room owner",
                duration: 5,
                placement: "top"
            });
        }
    }

    const onFinish = (values: any) => {
        console.log('Success:', values);
    };

    type FieldType = {
        message?: string;
    };

    const handleWhenLeave = async (): Promise<void> => {
        const yourId = user.id;
        const isOwner: boolean = roomInfo.members.find((m: UserDTO) => m.id === yourId && m.isRoomOwner === true) ? true : false;
        const room: RoomDTO = {
            id: roomInfo.id,
            name: roomInfo.name,
            roomOwnerId: isOwner ? yourId : undefined,
            guestId: isOwner ? undefined : yourId,
            members: roomInfo.members
        }

        const res = await leaveRoom(room);

        if (res.isSuccess == true) {
            setStep(2);
            const newUser: UserDTO = user;
            newUser.roomId = "";
            newUser.sitting = false;
            newUser.isRoomOwner = false;
            setUser(newUser);
            setRoomInfo(undefined);
        } else {
            api.warning({
                message: 'Error',
                description: "Something went wrong when leaving this room",
                duration: 3,
                placement: "top"
            });
        }
    }

    const handleWhenSitting = async (): Promise<void> => {
        if (start) {
            api.error({
                message: 'Error',
                description: "You cannot leave when playing!",
                duration: 3,
                placement: "top"
            });
            return;
        }
        if (user.isRoomOwner) {
            api.error({
                message: 'Error',
                description: "Your action cannot be done!",
                duration: 3,
                placement: "top"
            });
        } else {
            if (!guest) {
                const res = await updateUserSlot(user.id, true);
                if (res.isSuccess) {
                    setGuest(user);
                } else {
                    api.error({
                        message: 'Error',
                        description: res.errorMessage,
                        duration: 3,
                        placement: "top"
                    });
                }
            } else if (guest.id === user.id) {
                const res = await updateUserSlot(user.id, false);
                if (res.isSuccess) {
                    setGuest(user);
                } else {
                    api.error({
                        message: 'Error',
                        description: res.errorMessage,
                        duration: 3,
                        placement: "top"
                    });
                }
            } else {
                api.error({
                    message: 'Error',
                    description: "Already have user",
                    duration: 3,
                    placement: "top"
                });
            }
        }
    }

    const handleWhenStart = async (): Promise<void> => {
        const res = await startGame(roomInfo);
        if (res.isSuccess === true) {
            connection.invoke("StartMatch", res.responseData);
            setStart(true);
            setRoomOwnerTime(300);
            setCompetitorTime(300);
        } else {
            api.error({
                message: 'Error',
                description: res.errorMessage,
                duration: 3,
                placement: "top"
            });
        }
    }

    const handleWhenKick = async (): Promise<void> => {

    }

    return (
        <div className='game-menu'>
            {contextHolder}
            <Flex wrap="wrap" gap="small">
                {
                    user.isRoomOwner ?
                        <Button type="primary" disabled={!guest} onClick={handleWhenStart}>
                            Start
                        </Button> :
                        <></>
                }
                {
                    user.isRoomOwner ?
                        <Tooltip placement="topLeft" title={"Kick the user, who was sitting!"} arrow>
                            <Button type="default" disabled={!guest} danger onClick={handleWhenKick}>
                                Kick
                            </Button>
                        </Tooltip> :
                        <></>
                }

                <Button type="default" danger onClick={handleWhenLeave}>
                    Leave
                </Button>
            </Flex>
            <div className='players'>
                <div className='player'>
                    <div className='player-title'>
                        <div className='name'>
                            Room Owner
                        </div>
                        <div className='time'>
                            {start ?
                                <Time time={roomOwnerTime} /> : <></>
                            }
                        </div>
                    </div>
                    <div className='player-info current-user'>
                        <div className='info'>
                            <div className='avatar'>
                                <img src="human.jpg" alt="" />
                            </div>
                            <div className='player-name'>{roomInfo?.members.find((m: UserDTO) => m.isRoomOwner).userName}</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Wins: { }</div>
                            <div className='number-of-losses'>Losses: { }</div>
                        </div>
                    </div>
                </div>
                <div className="player">
                    <div className='player-title'>
                        <div className='name'>
                            Competitor
                        </div>
                        <div className='time'>
                            {start ?
                                <Time time={competitorTime} /> : <></>
                            }
                        </div>
                    </div>
                    <div className={`slot ${user.isRoomOwner ? "full" : ""} ${guest ? "joined" : ""} player-info ${guest ? "joined" : ""}`} onClick={handleWhenSitting}>
                        <div className='info'>
                            <div className='avatar'>
                                <img src="human.jpg" alt="" />
                            </div>
                            <div className='player-name'>{guest?.userName}</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Wins: { }</div>
                            <div className='number-of-losses'>Losses: { }</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='chat-area'>
                <div className='chat-title'>Chat</div>
                <div className='chat-content'>
                    <div className='chat-messages'>
                        {
                            messages?.map((mess, i) => (
                                <div id={mess.userId + "-mess-" + i} className={mess.isMyMessage ? "my-message" : "message"}>
                                    <b>{mess.userName} </b>{mess.message}
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className='chat-input'>
                    <Form
                        name="basic"
                        style={{ width: "100%" }}
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item<FieldType>
                            style={{
                                width: "100%"
                            }}
                            name="message"
                            rules={[{ required: true, message: 'Please type your message!' }]}
                        >
                            <Input size='small' style={{ width: "100%", borderRadius: "8px" }} prefix={
                                <Button htmlType="submit" type='link' icon={<AiOutlineSend size={22} />} />
                            } />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default GameMenu;