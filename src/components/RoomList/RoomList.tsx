import { FC, useContext, useEffect, useRef, useState } from "react";
import './RoomList.css';
import { Modal, Form, Button, List, Input, notification } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PlusOutlined } from '@ant-design/icons';
import { AccountStatus, ResponseData, RoomDTO, UserDTO } from "../../models/Models";
import { createRoom, getAllRooms, joinRoom } from "../../services/RoomServices";
import { StepContext, UserContext } from "../../helpers/Context";
import { getTokenProperties } from "../../helpers/Helper";
import { getAllUsers } from "../../services/UserServices";
const { Search } = Input;

interface RoomListProps extends React.HTMLAttributes<HTMLDivElement> {

}

const RoomList: FC<RoomListProps> = (props) => {
    const [roomCreationForm] = Form.useForm<RoomDTO>();
    const [step, setStep] = useContext(StepContext);
    const { setRedirectToLogin, connection, setRoomInfo, user, setUser } = useContext(UserContext);
    const [listRooms, setListRooms] = useState<RoomDTO[]>();
    const [listUsers, setListUsers] = useState<UserDTO[]>();
    const [openCreateRoom, setOpenCreateRoom] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const cLoaded = useRef<boolean>(false);

    const getListRooms = async (): Promise<void> => {
        const res = await getAllRooms("", 1, 20);
        if (res.isSuccess == true) {
            setListRooms(res.responseData.items);
        }
        if (res.isSuccess == false && res.code == 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
    }

    const getListUsers = async (): Promise<void> => {
        const res = await getAllUsers("", 1, 20);
        if (res.isSuccess == true) {
            setListUsers(res.responseData.items);
        }
        if (res.isSuccess == false && res.code == 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
    }

    useEffect(() => {
        getListRooms();
        getListUsers();
    }, []);

    useEffect(() => {
        if(cLoaded.current) return;
        if (connection) {
            connection.on("RoomCreated", async () => {
                await getListRooms();
            });
            connection.on("UserLoggedIn", async (message: string) => {
                await getListUsers();
            });
            connection.on("UserLoggedOut", async (message: string) => {
                await getListUsers();
            });

            connection.on("RoomClosed", async (id: string) => {
                await getListRooms();
            });
        }
        cLoaded.current = true;
    }, [connection]);

    const handleCreate = async (): Promise<void> => {
        roomCreationForm
            .validateFields()
            .then(async (values) => {
                setIsCreating(true);
                const result = await createRoom(values);
                if (result.code === 200 && result.isSuccess) {
                    roomCreationForm.resetFields();
                    const roomInfo: RoomDTO = result.responseData;
                    setUser({...user, roomId: roomInfo.id, isRoomOwner: true, sitting: true, isOnline: true});
                    setRoomInfo(roomInfo);
                    setStep(3);
                    setOpenCreateRoom(false);
                    setIsCreating(false);
                } else {
                    for (let it of result.errorMessage) {
                        api.error({
                            message: 'Create Failed',
                            description: it,
                            duration: -1,
                            placement: "top"
                        })
                    }
                    setIsCreating(false);
                }
            })
            .catch((info) => {
                setIsCreating(false);
            });
    }

    const handleJoin = async (room: RoomDTO): Promise<void> => {
        const currentRoom: RoomDTO = {
            id: room.id,
            name: room.name,
            guestId: user.id
        }
        const newUser: UserDTO = user;
        newUser.roomId = room.id;
        setUser(newUser);
        const res = await joinRoom(currentRoom);
        if (res.isSuccess) {
            setStep(3);
        }
    }

    return (
        <div className='in-room-container'>
            {contextHolder}
            <div className="room-header">
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setOpenCreateRoom(true)}>
                    Create a new room
                </Button>
                <Search className="input-search-room" addonBefore="Room Name" placeholder="input room name" allowClear size="large" />
            </div>
            <div className="room-container">
                <div className="list-rooms">
                    <List
                        style={{ minHeight: "100%" }}
                        size="small"
                        bordered
                        dataSource={listRooms || []}
                        renderItem={(item) =>
                            <List.Item
                                actions={[
                                    <Button type="primary" size="large" onClick={() => handleJoin(item)}>
                                        Join
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    title={<a href="">{item.name}</a>}
                                    description={`Joined Members: ${item.numberOfUsers}`}
                                />
                                <div>Owner: <b style={{ color: "#1677ff" }}>{item.members?.find(m => m.id === item.roomOwnerId)?.userName}</b></div>
                            </List.Item>
                        }
                    />
                </div>
                <div className="list-users">
                    <List
                        style={{ minHeight: "100%" }}
                        size="small"
                        bordered
                        dataSource={listUsers || []}
                        renderItem={(item) =>
                            <List.Item>
                                <List.Item.Meta
                                    title={<a href="">{item.userName}</a>}
                                    description={`Role: ${item.role}`}
                                />
                                <div><b style={{ color: item.isOnline ? "#1677ff" : "#ccc" }}>{item.isOnline ? "Online" : "Offline"}</b></div>
                            </List.Item>
                        }
                    />
                </div>
            </div>

            <Modal
                open={openCreateRoom}
                title="Create a new room"
                okText="Create"
                cancelText="Cancel"
                onCancel={() => { setOpenCreateRoom(false); setIsCreating(false); }}
                onOk={handleCreate}
                confirmLoading={isCreating}
                okButtonProps={{ htmlType: "submit" }}
            >
                <Form
                    form={roomCreationForm}
                    layout="horizontal"
                    name="create-room-form"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                >
                    <Form.Item
                        name="name"
                        label="Room Name"
                        rules={[{ required: true, message: 'Please input your room name' }]}
                    >
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item
                        initialValue={getTokenProperties("nameidentifier")}
                        name="roomOwnerId"
                        label="Room Owner"
                        hidden
                        rules={[{ required: true, message: 'Please input your room owner' }]}
                    >
                        <Input type="text" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default RoomList;