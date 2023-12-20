import { FC, useContext, useEffect, useRef, useState } from 'react';
import './GameMenu.css';
import { Button, Form, Input, Flex, notification } from 'antd';
import { AiOutlineSend } from "react-icons/ai";
import { StepContext, UserContext } from '../../helpers/Context';
import { Message, RoomDTO, UserDTO } from '../../models/Models';
import { getRoom, leaveRoom } from '../../services/RoomServices';

interface GameMenuProps extends React.HTMLAttributes<HTMLDivElement> {

}

const GameMenu: FC<GameMenuProps> = (props) => {
    const { connection, roomInfo, setRoomInfo, user, setUser } = useContext(UserContext);
    const [step, setStep] = useContext(StepContext);
    const [guest, setGuest] = useState<UserDTO>();
    const [messages, setMessages] = useState<Message[]>();
    const cLoaded = useRef<boolean>(false);
    const [api, contextHolder] = notification.useNotification();

    const getRoomInfo = async (): Promise<void> => {
        const currentRoom = await getRoom(user.roomId);
        if (currentRoom.isSuccess) {
            setRoomInfo(currentRoom.responseData);
        }
    }
    
    useEffect(() => {
        if (cLoaded.current) return;
        if (!roomInfo) {
            getRoomInfo();
        }
    }, [roomInfo]);

    useEffect(() => {
        if (cLoaded.current) return;
        connection.on("RoomOwnerChanged", (id: string): void => {
            console.log(id);
            const areYouOwner: boolean = user.id === id;
            console.log(areYouOwner);
            if (areYouOwner) {

            }
        });

        connection.on("UserLeaved", (id: string): void => {
            console.log("user id leaved", id);
        });

        connection.on("UserJoined", (user: UserDTO): void => {
            setMessages((prev) => {
                const newMess: Message[] = prev && prev?.length ? [...prev] : [];
                const mess: Message = {
                    userId: user.id,
                    userName: user.userName,
                    isMyMessage: false,
                    message: `${user.userName} joined`
                }
                newMess.push(mess);
                return newMess;
            })
        });

        connection.on("RoomOwnerChanged", (id: string): void => {
            setRoomInfo((prev: RoomDTO) => {
                const newRoomInfo: RoomDTO = { ...prev };
                const newMembers = newRoomInfo.members?.filter(m => !m.isRoomOwner);
                newMembers?.forEach(nm => {
                    if(nm.id === id) {
                        nm.isRoomOwner = true;
                    }
                });
                newRoomInfo.members = newMembers;
                return newRoomInfo;
            });
        });

        connection.on("RoomClosed", (): void => {
            setStep(2);
            setRoomInfo(undefined);
        });
        cLoaded.current = true;
    }, []);

    const onFinish = (values: any) => {
        console.log('Success:', values);
    };

    type FieldType = {
        message?: string;
    };

    const handleWhenLeave = async () => {
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
            const newUser: UserDTO = user;
            newUser.roomId = "";
            newUser.sitting = false;
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

    return (
        <div className='game-menu'>
            {contextHolder}
            <Flex wrap="wrap" gap="small">
                <Button type="primary" danger onClick={handleWhenLeave}>
                    Leave
                </Button>
            </Flex>
            <div className='players'>
                <div className='player'>
                    <div className='player-title'>Owner</div>
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
                    <div className='player-title'>Competitor</div>
                    <div className={`player-info ${guest ? "joined" : ""}`}>
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
                                <div id={mess.userId + i} className={mess.isMyMessage ? "my-message" : "message"}>
                                    <b>{mess.userName}: </b>{mess.message}
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