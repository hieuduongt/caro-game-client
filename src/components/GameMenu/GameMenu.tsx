import { FC, useContext, useEffect, useRef, useState } from 'react';
import './GameMenu.css';
import { Button, Form, Input, Flex, notification, Avatar, Collapse, Tooltip } from 'antd';
import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { AiOutlineSend } from "react-icons/ai";
import { FaRegCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { AppContext } from '../../helpers/Context';
import { MatchDTO, MessageDto, UserDTO } from '../../models/Models';
import { getRoomOfCurrentUser, leaveRoom, sit, leaveTheSit } from '../../services/RoomServices';
import { getUser } from '../../services/UserServices';
import { startGame } from '../../services/GameServices';
import Time from '../Time/Time';
import { getMessageOfRoom, sendMessageToGroup } from '../../services/ChatServices';
import { v4 as uuidv4 } from 'uuid';
import ScrollToBottom from 'react-scroll-to-bottom';
import { formatUTCDateToLocalDate, generateShortUserName } from '../../helpers/Helper';

interface GameMenuProps extends React.HTMLAttributes<HTMLDivElement> {

}

const GameMenu: FC<GameMenuProps> = (props) => {
    const { connection, roomInfo, setRoomInfo, user, setUser, start, setStart, setStep, setYourTurn, newGame, setNewGame, setMatchInfo, watchMode, setWatchMode, addNewNotifications } = useContext(AppContext);
    const [messages, setMessages] = useState<MessageDto[]>();
    const [sitted, setSitted] = useState<boolean>(false);
    const [roomOwnerTime, setRoomOwnerTime] = useState<number>(0);
    const [competitorTime, setCompetitorTime] = useState<number>(0);
    const cLoaded = useRef<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const [form] = Form.useForm();

    const getRoomInfo = async (): Promise<void> => {
        const currentRoom = await getRoomOfCurrentUser();
        if (currentRoom.isSuccess) {
            setRoomInfo(currentRoom.responseData);
            await getRoomMessages(currentRoom.responseData.id);
            const sittedMember = currentRoom.responseData.members?.find(m => m.sitting && !m.isRoomOwner);
            if (sittedMember) {
                setSitted(true);
            } else {
                setSitted(false);
            }
        } else {
            addNewNotifications(currentRoom.errorMessage, "error");
        }
    }

    const getUserInfo = async (): Promise<void> => {
        const res = await getUser(user.id);
        if (res.isSuccess) {
            setUser(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const addGroupMessage = (message: string | MessageDto, userId?: string) => {
        if (typeof message === "string" && typeof message !== "object") {
            setMessages((prev) => {
                const newMess: MessageDto[] = prev && prev?.length ? [...prev] : [];
                const mess: MessageDto = {
                    id: uuidv4(),
                    userId: userId ? userId : "",
                    content: message,
                    createdDate: new Date(),
                    updatedDate: new Date()
                }
                newMess.push(mess);
                return newMess;
            });
        } else {
            setMessages((prev) => {
                const newMess: MessageDto[] = prev && prev?.length ? [...prev] : [];
                const mess: MessageDto = {
                    id: uuidv4(),
                    userId: userId ? userId : message.userId ? message.userId : "",
                    content: message.content,
                    createdDate: message.createdDate,
                    updatedDate: message.updatedDate
                }
                newMess.push(mess);
                return newMess;
            });
        }
    }

    useEffect(() => {
        if (cLoaded.current) return;
        if (!roomInfo) {
            getRoomInfo();
        } else {
            getRoomMessages(roomInfo.id);
        }
        if (!user) {
            getUserInfo();
        }

        connection.on("GroupUserSitting", async (isSitting: boolean): Promise<void> => {
            await getRoomInfo();
            setSitted(isSitting);
        });

        connection.on("IsKicked", async (): Promise<void> => {
            await getRoomInfo();
            await getUserInfo();
            setSitted(false);
            api.warning({
                message: 'Pay attention',
                description: "You were kicked from your sit by the room owner",
                duration: 3,
                placement: "top"
            });
        });

        connection.on("MatchStartResponseForInMatchMember", (match: MatchDTO): void => {
            setNewGame((prev: number) => {
                return prev + 1;
            });
            setStart(true);
            setMatchInfo(match);
            addGroupMessage("game started!!!");
            setRoomOwnerTime(300);
            setCompetitorTime(300);
        });

        connection.on("UserJoinedRoom", async (userName: string, roomId: string): Promise<void> => {
            addGroupMessage(`${userName} joined`);
            await getRoomInfo();
        });

        connection.on("UserLeavedRoom", async (userName: string, roomId: string): Promise<void> => {
            addGroupMessage(`${userName} Leaved`);
            await getRoomInfo();
        });

        connection.on("GroupRoomClosed", async (): Promise<void> => {
            await onRoomClosed();
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

        connection.on("MatchResponseForWinner", async (): Promise<void> => {
            await getRoomInfo();
            setMatchInfo(undefined);
            setStart(false);
        });

        connection.on("NewGroupMessage", async (message: MessageDto): Promise<void> => {
            addGroupMessage(message);
        });

        connection.on("MatchResponseForLoser", async (matchId: string): Promise<void> => {
            await getRoomInfo();
            setMatchInfo(undefined);
            setStart(false);
        });

        connection.on("MatchStartResponseForInRoomMembers", async (matchInfo: MatchDTO): Promise<void> => {
            await getRoomInfo();
            setWatchMode(true);
        });

        connection.on("MatchFinishResponseForInRoomMembers", async (matchId: string): Promise<void> => {
            await getRoomInfo();
            setWatchMode(false);
        });

        cLoaded.current = true;
    }, []);

    const getRoomMessages = async (roomId: string) => {
        const res = await getMessageOfRoom(roomId);
        if (res.isSuccess) {
            if (res.responseData && res.responseData.items?.length) {
                setMessages(res.responseData.items);
            }
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const onRoomClosed = async (): Promise<void> => {
        await getUserInfo();
        setRoomInfo(undefined);
        setMessages([]);
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
        await getRoomInfo();
        setStart(false);
    }

    const handleSendGroupMessage = async (values: any) => {
        const { message } = values;
        const newMessage: MessageDto = {
            content: message,
            conversationId: roomInfo.conversation.id,
            roomId: roomInfo.id
        }
        const res = await sendMessageToGroup(newMessage);
        if (res.isSuccess) {
            addGroupMessage(message, user.id);
            form.resetFields();
        } else {
            addNewNotifications(res.errorMessage, "error");
        }

    };

    type FieldType = {
        message?: string;
    };

    const handleWhenLeaveRoom = async (): Promise<void> => {
        const res = await leaveRoom(roomInfo.id);
        if (res.isSuccess === true) {
            await getUserInfo();
            setRoomInfo(undefined);
            setStep(2);
        } else {
            api.warning({
                message: 'Error',
                description: "Something went wrong when leaving this room",
                duration: 3,
                placement: "top"
            });
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const handleWhenSitting = async (): Promise<void> => {
        if (user.isRoomOwner || sitted) return;
        if (roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.id) return;
        const res = await sit(roomInfo.id);
        if (res.isSuccess) {
            await getRoomInfo();
            await getUserInfo();
            setSitted(true);
        } else {
            addNewNotifications(res.errorMessage, "error");
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
        const res = await leaveTheSit(roomInfo.id, userId);
        if (res.isSuccess) {
            if (!user.isRoomOwner) {
                await getRoomInfo();
                await getUserInfo();
            }
            setSitted(false);
        } else {
            addNewNotifications(res.errorMessage, "error");
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
            api.info({
                message: 'Your turn',
                description: "You will go first!",
                duration: 5,
                placement: "top"
            });
        } else {
            api.error({
                message: 'Error',
                description: res.errorMessage,
                duration: 3,
                placement: "top"
            });
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const renderOutgoingIncomingMessage = (isMyMessage: boolean) => {
        return isMyMessage ? "outgoing-message" : "incomming-message";
    }

    return (
        <div className='game-menu'>
            {contextHolder}
            <Flex wrap="wrap" gap="small">
                {
                    user.isRoomOwner ?
                        <Button type="primary" disabled={!sitted || start} onClick={handleWhenStart}>
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
                            {start || watchMode ?
                                <Time time={roomOwnerTime} /> : <></>
                            }
                        </div>
                    </div>
                    <div className='player-info current-user'>
                        <div className='info'>
                            <div className='player-icon'>
                                <FaRegCircle size={20} color='red' />
                            </div>

                            <div className='player-name'>{roomInfo?.members?.find((m: UserDTO) => m.isRoomOwner)?.userName}</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Wins: {roomInfo?.members?.find((m: UserDTO) => m.isRoomOwner)?.winMatchs || "0"}</div>
                            <div className='number-of-losses'>Losses: {roomInfo?.members?.find((m: UserDTO) => m.isRoomOwner)?.loseMatchs || "0"}</div>
                        </div>
                    </div>
                </div>
                <div className="player">
                    <div className='player-title'>
                        <Button type="primary" danger shape="round" disabled={user.isRoomOwner ? false : user.id === roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.id ? false : true} size='small' icon={<CloseOutlined />} onClick={handleWhenLeaveSitting}>
                            {user.isRoomOwner ? "Kick" : "Leave The Sit"}
                        </Button>
                        <div className='time'>
                            {start || watchMode ?
                                <Time time={competitorTime} /> : <></>
                            }
                        </div>
                    </div>
                    <div className={`slot ${user.isRoomOwner || roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting) ? "full" : ""} ${sitted || roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting) ? "joined" : ""} player-info`} onClick={handleWhenSitting}>
                        <div className='info'>
                            <div className='player-icon'>
                                <MdClose size={28} color='blue' />
                            </div>
                            <div className='player-name'>{roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.userName}</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Wins: {roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.winMatchs || "0"}</div>
                            <div className='number-of-losses'>Losses: {roomInfo?.members?.find((m: UserDTO) => !m.isRoomOwner && m.sitting)?.loseMatchs || "0"}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='chat-area'>
                <div className='chat-title'>
                </div>
                <div className='chat-content'>
                    <div className='chat-messages'>
                        <ScrollToBottom scrollViewClassName='group-message' followButtonClassName="scroll-to-bottom">
                            {
                                messages?.map(ms => (
                                    <Collapse
                                        className={`${renderOutgoingIncomingMessage(ms.userId === user?.id)}`}
                                        items={[{
                                            key: ms.id,
                                            label: <span>{ms.content}</span>,
                                            children: <span>Sent at {formatUTCDateToLocalDate(ms.updatedDate!)}</span>
                                        }]}
                                        expandIcon={() =>
                                            <Tooltip title={ms.userId === user?.id ? "You" : ms.userName} placement="top">
                                                <Avatar style={{ verticalAlign: 'middle', cursor: "pointer" }} size={20} gap={2}>
                                                    {ms.userName}
                                                </Avatar>
                                            </Tooltip>

                                        }
                                        size="small"
                                        expandIconPosition={ms.userId === user?.id ? "start" : "end"}
                                    />
                                ))
                            }
                        </ScrollToBottom>
                    </div>
                </div>
                <div className='chat-input'>
                    <Form
                        form={form}
                        name="basic"
                        style={{ width: "100%" }}
                        onFinish={handleSendGroupMessage}
                        autoComplete="off"
                    >
                        <Form.Item<FieldType>
                            style={{
                                width: "100%"
                            }}
                            name="message"
                            rules={[{ required: true, message: 'Please type your message!' }]}
                        >
                            <Input size='small' style={{ width: "100%", borderRadius: "8px" }} placeholder='Type your message' prefix={
                                <Button htmlType="submit" type='link' icon={<AiOutlineSend size={22} />} />
                            } />
                        </Form.Item>
                    </Form>
                </div>
                <div className="users-in-room">
                    <div style={{ fontSize: 12 }}>Members: </div>
                    <Avatar.Group maxCount={5} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                        {roomInfo?.members.map((m: UserDTO) => (
                            <Tooltip title={m.userName} placement="top">
                                <Avatar style={{ backgroundColor: '#87d068' }} >{generateShortUserName(m.userName)}</Avatar>
                            </Tooltip>
                        ))}

                    </Avatar.Group>
                </div>
            </div>
        </div>
    )
}

export default GameMenu;