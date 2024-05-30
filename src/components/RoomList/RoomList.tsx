import React, { FC, useContext, useEffect, useRef, useState } from "react";
import './RoomList.css';
import { Modal, Form, Button, Input, notification, Table, Tag, Tooltip, Avatar } from 'antd';
import { UserOutlined, MessageTwoTone, PlusOutlined } from '@ant-design/icons';
import { RoomDTO, UserDTO, Pagination, Status, Roles, RoleDTO } from "../../models/Models";
import { createRoom, getAllRooms, getRoom, joinRoom } from "../../services/RoomServices";
import { AppContext } from "../../helpers/Context";
import { getTokenProperties } from "../../helpers/Helper";
import { getAllUsers } from "../../services/UserServices";
import type { ColumnsType } from 'antd/es/table';
import { GiRoundTable } from "react-icons/gi";
import { RiLoginCircleLine } from "react-icons/ri";
import { SystemString } from "../../common/StringHelper";
import { getUnReadNotifications } from "../../services/NotificationServices";
const { Search } = Input;

interface RoomListProps extends React.HTMLAttributes<HTMLDivElement> {
    handleWhenOpeningNewConversation: (toUserId: string) => void;
}

const CustomRow: FC<any> = (props) => {
    return (
        <Tooltip title="Double-click or click on the Join button to join">
            <tr {...props} />
        </Tooltip>
    );
}

const RoomList: FC<RoomListProps> = (props) => {
    const { handleWhenOpeningNewConversation } = props;
    const [roomCreationForm] = Form.useForm<RoomDTO>();
    const { setRedirectToLogin, connection, setRoomInfo, user, setUser, setStep, addNewNotifications } = useContext(AppContext);
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
            render: (text) => <Tooltip placement="topLeft" title={text}><a href="#" className="user-name">{text}</a></Tooltip>,
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
            render: (roles: RoleDTO[]) => {
                const data = roles.map(rs => {
                    return Roles.find(r => r.value === rs.name);
                })
                return (
                    data.map(d => (
                        <Tag color={d?.color}>{d?.value.toUpperCase()}</Tag>
                    ))
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
            title: 'Chat',
            key: 'action',
            render: (_, record: UserDTO) => (
                <Button icon={<MessageTwoTone twoToneColor="#eb2f96" />} onClick={() => handleWhenOpeningNewConversation(record.id)} type="text" shape="circle"></Button>
            )
        },
    ];

    const getListRooms = async (search?: string, page?: number, pageSize?: number): Promise<void> => {
        setRoomReloadState(true);
        const res = await getAllRooms(search, page, pageSize);
        if (res.isSuccess === true) {
            setListRooms(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        if (res.isSuccess === false && res.code === 401) {
            setStep(1);
            setRedirectToLogin(true);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        setRoomReloadState(false);
    }

    const getListUsers = async (search?: string, page?: number, pageSize?: number): Promise<void> => {
        setUserReloadState(true);
        const res = await getAllUsers(search, page, pageSize);
        if (res.isSuccess === true) {
            setListUsers(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        if (res.isSuccess === false && res.code === 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
        setUserReloadState(false);
    }

    const getAllUnreadNotifications = async (search: string, page: number, pageSize: number) => {
        const res = await getUnReadNotifications(search, page, pageSize);
        if (res.isSuccess && res.responseData && res.responseData.items) {
            addNewNotifications(res.responseData.items, 'info');
        } else {
            addNewNotifications(res.errorMessage, 'error');
        }
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
        getAllUnreadNotifications("", 1, 20);
        cLoaded.current = true;
    }, []);

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
                    addNewNotifications(result.errorMessage, "error");
                    setIsCreating(false);
                }
            })
            .catch((info) => {
                addNewNotifications(SystemString.ValidationError, "error");
                setIsCreating(false);
            });
    }

    const handleJoin = async (room: RoomDTO): Promise<void> => {

        const res = await joinRoom(room.id);
        if (res.isSuccess) {
            const currentRoomRes = await getRoom(room.id);
            const newUser: UserDTO = user;
            if (currentRoomRes.isSuccess && currentRoomRes.responseData) {
                setRoomInfo(currentRoomRes.responseData);
                newUser.roomId = currentRoomRes.responseData.id;
                setUser(newUser);
                setStep(3);
            } else {
                addNewNotifications(currentRoomRes.errorMessage, "error");
            }
        } else {
            addNewNotifications(res.errorMessage, "error");
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
                        dataSource={listUsers?.items?.filter(u => u.id !== user.id) || []}
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