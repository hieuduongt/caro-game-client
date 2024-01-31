import { FC, useContext, useEffect, useRef, useState } from 'react';
import './GameMenu.css';
import { Button, Form, Input, Flex, notification, Tooltip } from 'antd';
import { CloseOutlined } from "@ant-design/icons";
import { AiOutlineSend } from "react-icons/ai";
import { AppContext } from '../../helpers/Context';
import { AccountStatus, MatchDTO, Message, RoomDTO, UserDTO } from '../../models/Models';
import { getRoom, leaveRoom } from '../../services/RoomServices';
import { getUser, updateUserSlot } from '../../services/UserServices';
import { finishGame, startGame } from '../../services/GameServices';
import Time from '../Time/Time';

interface GameMenuProps extends React.HTMLAttributes<HTMLDivElement> {

}

const GameMenu: FC<GameMenuProps> = (props) => {
    const { connection, roomInfo, setRoomInfo, user, setUser, start, setStart, setStep, setYourTurn, newGame, setNewGame, setMatchInfo } = useContext(AppContext);
    const [messages, setMessages] = useState<Message[]>();
    const [sitted, setSitted] = useState<boolean>(false);
    const [roomOwnerTime, setRoomOwnerTime] = useState<number>(0);
    const [competitorTime, setCompetitorTime] = useState<number>(0);
    const cLoaded = useRef<boolean>(false);
    const [api, contextHolder] = notification.useNotification();

    const getRoomInfo = async (): Promise<void> => {
        if (user.roomId !== "" && user.roomId !== null && user.roomId !== undefined) {
            const currentRoom = await getRoom(user.roomId);
            if (currentRoom.isSuccess) {
                setRoomInfo(currentRoom.responseData);
                const sittedMember = currentRoom.responseData.members?.find(m => m.sitting && !m.isRoomOwner);
                if (sittedMember) {
                    setSitted(true);
                } else {
                    setSitted(false);
                }
            }
        }
    }

    useEffect(() => {
        getRoomInfo();
    }, [user]);

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
            setSitted(false);
        });

        connection.on("UserSitted", async (): Promise<void> => {
            await getRoomInfo();
        });

        connection.on("start", (match: MatchDTO): void => {
            setNewGame((prev: number) => {
                return prev + 1;
            });
            setStart(true);
            setMatchInfo(match);
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
            setRoomOwnerTime(300);
            setCompetitorTime(300);
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
            await changeOwner(id);
            await getRoomInfo();
        });

        connection.on("RoomClosedGroup", (): void => {
            onRoomClosed();
        });

        connection.on("TimeUpdate", (time: number, isRoomOwner: boolean): void => {
            if (isRoomOwner) {
                setRoomOwnerTime(time);
            } else {
                setCompetitorTime(time);
            }
        });

        connection.on("TimesUp", async (match: MatchDTO, loseUserId: string): Promise<void> => {
            await handleWhenTimesUp(match, loseUserId);
        });

        connection.on("Winner", async (): Promise<void> => {
            await getRoomInfo();
            setMatchInfo(undefined);
            setStart(false);
        });

        connection.on("Loser", async (matchId: string): Promise<void> => {
            await getRoomInfo();
            setMatchInfo(undefined);
            setStart(false);
        });

        connection.on("StartGroup", async (): Promise<void> => {
            await getRoomInfo();
        });

        connection.on("FinishGroup", async (): Promise<void> => {
            await getRoomInfo();
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
        match.userInMatches.forEach(u => {
            if (u.id === loseUserId) {
                u.isWinner = false;
            } else {
                u.isWinner = true;
            }
            delete u.time;
        });
        await finishGame(match);
        await getRoomInfo();
        setStart(false);
    }

    const changeOwner = async (id: string): Promise<void> => {
        if (id === user.id) {
            const res = await getUser(id);
            if (res.isSuccess) {
                setUser(res.responseData);
                api.info({
                    message: 'Info',
                    description: "the Room owner is quit, now you are room owner",
                    duration: 5,
                    placement: "top"
                });
            }
        }
    }

    console.log(user);

    const onFinish = (values: any) => {
        console.log('Success:', values);
    };

    type FieldType = {
        message?: string;
    };

    const handleWhenLeaveRoom = async (): Promise<void> => {
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

        if (res.isSuccess === true) {
            const newUser: UserDTO = user;
            newUser.roomId = "";
            newUser.sitting = false;
            newUser.isRoomOwner = false;
            newUser.isPlaying = false;
            newUser.isRoomOwner = false;
            setUser(newUser);
            setRoomInfo(undefined);
            setStep(2);
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
        if (user.isRoomOwner || sitted) return;
        const res = await updateUserSlot(user.id, true);
        if (res.isSuccess) {
            setSitted(true);
        }
    }

    const handleWhenLeaveSitting = async (): Promise<void> => {
        if (!sitted) return;
        let userId: string;
        if (user.isRoomOwner) {
            userId = roomInfo.members.find((m: UserDTO) => !m.isRoomOwner && m.sitting).id;
        } else {
            userId = user.id;
        }
        const res = await updateUserSlot(userId, false);
        if (res.isSuccess) {
            setSitted(false);
        }
    }

    const handleWhenStart = async (): Promise<void> => {
        const res = await startGame(roomInfo);
        if (res.isSuccess === true) {
            setMatchInfo(res.responseData);
            setNewGame(newGame + 1);
            setStart(true);
            setYourTurn(true);
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

    return (
        <div className='game-menu'>
            {contextHolder}
            <Flex wrap="wrap" gap="small">
                {
                    user.isRoomOwner ?
                        <Button type="primary" disabled={!sitted} onClick={handleWhenStart}>
                            Start
                        </Button> :
                        <></>
                }

                <Button type="default" disabled={start} danger onClick={handleWhenLeaveRoom}>
                    Leave This Room
                </Button>
            </Flex>
            <div className='players'>
                <div className='player'>
                    <div className='player-title'>
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
                        <Button type="primary" danger shape="round" disabled={user.isRoomOwner && sitted ? false : !sitted} size='small' icon={<CloseOutlined />} onClick={handleWhenLeaveSitting}>
                            {user.isRoomOwner ? "Kick" : "Leave"}
                        </Button>
                        <div className='time'>
                            {start ?
                                <Time time={competitorTime} /> : <></>
                            }
                        </div>
                    </div>
                    <div className={`slot ${user.isRoomOwner ? "full" : ""} ${sitted ? "joined" : ""} player-info`} onClick={handleWhenSitting}>
                        <div className='info'>
                            <div className='avatar'>
                                <img src="human.jpg" alt="" />
                            </div>
                            <div className='player-name'>{roomInfo?.members.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.userName}</div>
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