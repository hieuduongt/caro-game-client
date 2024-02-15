import { FC, useContext, useEffect, useRef, useState } from "react";
import './RoomList.css';
import { Modal, Form, Button, Input, notification, Table, Tag, Tooltip, Avatar, Popover } from 'antd';
import { UserOutlined, SendOutlined, PlusOutlined } from '@ant-design/icons';
import { RoomDTO, UserDTO, Pagination, Status, ActionRoomDTO, Roles } from "../../models/Models";
import { createRoom, getAllRooms, getRoom, joinRoom } from "../../services/RoomServices";
import { AppContext } from "../../helpers/Context";
import { getTokenProperties, removeAuthToken } from "../../helpers/Helper";
import { getAllUsers } from "../../services/UserServices";
import type { ColumnsType } from 'antd/es/table';
import { GiRoundTable } from "react-icons/gi";
import { RiLoginCircleLine } from "react-icons/ri";
const { Search } = Input;
interface RoomListProps extends React.HTMLAttributes<HTMLDivElement> {

}

const CustomRow: FC<any> = (props) => {
    return (
        <Tooltip title="Double-click or click on the Join button to join">
            <tr {...props} />
        </Tooltip>
    );
}

const RoomList: FC<RoomListProps> = (props) => {
    const [roomCreationForm] = Form.useForm<RoomDTO>();
    const { setRedirectToLogin, connection, setRoomInfo, user, setUser, setStep } = useContext(AppContext);
    const [listRooms, setListRooms] = useState<Pagination<RoomDTO>>();
    const [roomSearchKeywords, setRoomSearchKeywords] = useState<string>("");
    const [listUsers, setListUsers] = useState<Pagination<UserDTO>>();
    const [userSearchKeywords, setUserSearchKeywords] = useState<string>("");
    const [openCreateRoom, setOpenCreateRoom] = useState<boolean>(false);
    const [userReloadState, setUserReloadState] = useState<boolean>(false);
    const [roomReloadState, setRoomReloadState] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const cLoaded = useRef<boolean>(false);

    const roomColumns: ColumnsType<RoomDTO> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',

            sorter: (a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            },
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Members',
            dataIndex: 'members',
            key: 'members',
            render: (members: UserDTO[]) => {
                return (
                    <Avatar.Group maxCount={4} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                        {members.map(m => (
                            <Avatar key={m.id} style={{ backgroundColor: '#2db7f5' }}>{m.userName}</Avatar>
                        ))}
                    </Avatar.Group>
                )
            }
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status: Status) => {
                let color = "error";
                if (status === Status.Available) {
                    color = "green";
                }
                return (
                    <Tag color={color} key={"status"}>
                        {Status[status].toUpperCase()}
                    </Tag>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button style={{ display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => handleJoin(record)} type="dashed"><RiLoginCircleLine style={{ marginRight: "5px" }} size={20} />Join {record.name}</Button>
            ),
        },
    ];

    const userColumns: ColumnsType<UserDTO> = [
        {
            title: 'Name',
            dataIndex: 'userName',
            key: 'userName',
            render: (text) => <a href="#">{text}</a>,
            sorter: (a, b) => {
                if (a.userName < b.userName) {
                    return -1;
                }
                if (a.userName > b.userName) {
                    return 1;
                }
                return 0;
            },
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (roles: string[]) => {
                const data = Roles.find(r => r.value === roles[0]);
                return (
                    <Tag color={data?.color}>{data?.value}</Tag>
                )
            }
        },
        {
            title: 'Status',
            key: '',
            dataIndex: '',
            sortDirections: ['descend', 'ascend'],
            render: (user: UserDTO) => {
                let status = "";
                let color = "";
                if (!user.isOnline) {
                    color = "error";
                    status = "Offline";
                }
                if (user.isOnline) {
                    status = "Online";
                    color = "green";
                }
                if (user.roomId) {
                    status = "In Room";
                    color = "orange";
                }

                if (user.isPlaying) {
                    status = "Playing";
                    color = "gold";
                }
                return (
                    <Tag color={color} key={"status"}>
                        {
                            status
                        }
                    </Tag>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button icon={<SendOutlined />} type="text">Chat</Button>
            )
        },
    ];

    const getListRooms = async (search?: string, page?: number, pageSize?: number): Promise<void> => {
        setRoomReloadState(true);
        const res = await getAllRooms(search, page, pageSize);
        if (res.isSuccess === true) {
            setListRooms(res.responseData);
        }
        if (res.isSuccess === false && res.code === 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
        setRoomReloadState(false);
    }

    const getListUsers = async (search?: string, page?: number, pageSize?: number): Promise<void> => {
        setUserReloadState(true);
        const res = await getAllUsers(search, page, pageSize);
        if (res.isSuccess === true) {
            setListUsers(res.responseData);
        }
        if (res.isSuccess === false && res.code === 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
        setUserReloadState(false);
    }


    useEffect(() => {
        if (cLoaded.current) return;
        getListRooms(roomSearchKeywords || "", 1, 20);
        getListUsers(userSearchKeywords || "", 1, 20);
        if (connection) {
            connection.on("GlobalRoomUpdating", async () => {
                await getListRooms(roomSearchKeywords, 1, 20);
            });
            connection.on("UserLoggedIn", async (message: string) => {
                await getListUsers(userSearchKeywords, 1, 20);
            });
            connection.on("UserLoggedOut", async (message: string) => {
                await getListUsers(userSearchKeywords, 1, 20);
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
                    const newUser: UserDTO = user;
                    newUser.roomId = roomInfo.id;
                    newUser.isRoomOwner = true;
                    newUser.sitting = true;
                    setUser(newUser);
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
        const currentRoom: ActionRoomDTO = {
            id: room.id,
            userId: user.id
        }
        const res = await joinRoom(currentRoom);
        if (res.isSuccess) {
            const room = await getRoom(currentRoom.id);
            console.log(room);
            const newUser: UserDTO = user;
            if (room.isSuccess && room.responseData) {
                setRoomInfo(room.responseData);
                newUser.roomId = room.responseData.id;
                setUser(newUser);
                setStep(3);
            }
        }
    }

    const handleWhenSearchRoom = async (value: string, event?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>, info?: {
        source?: 'clear' | 'input';
    }): Promise<void> => {
        if (value && info?.source === "input") {
            await getListRooms(value, 1, 20);
            setRoomSearchKeywords(value);
        }

        if (info?.source === "clear") {
            await getListRooms("", 1, 20);
            setRoomSearchKeywords("");
        }
    }

    const handleWhenSearchUser = async (value: string, event?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>, info?: {
        source?: 'clear' | 'input';
    }): Promise<void> => {
        if (info?.source === "input") {
            await getListUsers(value || "", 1, 20);
            setUserSearchKeywords(value || "");
        }

        if (info?.source === "clear") {
            await getListUsers("", 1, 20);
            setUserSearchKeywords("");
        }
    }

    const handleWhenUserPaginationChange = async (page: number, pageSize: number): Promise<void> => {
        await getListUsers(userSearchKeywords, page, pageSize);
    }

    const handleWhenRoomPaginationChange = async (page: number, pageSize: number): Promise<void> => {
        await getListRooms(roomSearchKeywords, page, pageSize);
    }

    const logOut = (): void => {
        setUser(undefined);
        removeAuthToken();
        setStep(1);
        connection?.stop();
    }

    return (
        <div className='in-room-container'>
            {contextHolder}
            <div className="room-container">
                <div className="list-rooms">
                    <Table
                        columns={roomColumns}
                        dataSource={listRooms?.items}
                        pagination={{ position: ["bottomCenter"], pageSize: listRooms?.pageSize, current: listRooms?.currentPage, total: listRooms?.totalRecords, onChange: handleWhenRoomPaginationChange }}
                        title={() =>
                            <>
                                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setOpenCreateRoom(true)}>
                                    New room
                                </Button>
                                <Search className="input-search-room" addonBefore={<GiRoundTable size={22} />} placeholder="input room name" allowClear size="large" onSearch={handleWhenSearchRoom} />
                            </>}
                        scroll={{ y: 550 }}
                        rowKey={(record) => record.id}
                        onRow={(record) => {
                            return {
                                onDoubleClick: (event) => handleJoin(record)
                            }
                        }}
                        components={{
                            body: {
                                row: CustomRow
                            }
                        }}
                        loading={roomReloadState}
                    />
                </div>
                <div className="list-users">
                    <Table
                        pagination={{ position: ["bottomCenter"], pageSize: listUsers?.pageSize, current: listUsers?.currentPage, total: listUsers?.totalRecords, onChange: handleWhenUserPaginationChange }}
                        columns={userColumns}
                        dataSource={listUsers?.items}
                        title={() =>
                            <>
                                <Search className="input-search-user" addonBefore={<UserOutlined />} placeholder="input user name" allowClear size="large" onSearch={handleWhenSearchUser} />
                            </>}
                        scroll={{ y: 550 }}
                        rowKey={(record) => record.id}
                        loading={userReloadState}
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