import { Alert, Avatar, Badge, Button, Checkbox, Drawer, Form, Input, Modal, Popover, Space, Spin, notification, Select, Table, Tag, Tooltip, InputNumber, message } from 'antd';
import { FC, createRef, useEffect, useState } from 'react';
import { LoadingOutlined, AlertOutlined, UserOutlined } from '@ant-design/icons';
import { AccountStatus, BanReasonDto, BanRequestDto, NotificationDto, Pagination, RoleDTO, Roles, SetRolesRequestDto, TimeType, TokenDto, UserDTO } from './models/Models';
import { access, authenticateUsingRefreshToken, banUser, getBanReasons, getRoles, logout, setRoles, unBanUser } from './services/AuthServices';
import { compareArray, formatUTCDateToLocalDate, generateShortUserName, getAuthToken, getRefreshToken, getTokenProperties, isExpired, removeAuthToken, removeRefreshToken, setAuthToken, setRefreshToken } from './helpers/Helper';
import { v4 as uuidv4 } from 'uuid';
import { getAllUsers, getUser } from './services/UserServices';
import { login } from './services/AuthServices';
import { SystemString } from './common/StringHelper';
import type { SelectProps, TableProps } from 'antd';
const { Search } = Input;

type TagRender = SelectProps['tagRender'];

const tagRender: TagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    let color = "";
    let newLabel = "";

    if (typeof label === "string") {
        color = label?.split("|")[1];
        newLabel = label?.split("|")[0];
    }
    return (
        <Tag
            color={color}
            onMouseDown={onPreventMouseDown}
            closable={closable}
            onClose={onClose}
            style={{ marginInlineEnd: 4 }}
        >
            {newLabel}
        </Tag>
    );
};

const columns: TableProps<UserDTO>['columns'] = [
    {
        title: 'User Name',
        dataIndex: 'userName',
        key: 'userName',
        render: (text) => <a>{text}</a>,
    },
    {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
    },
    {
        title: 'Last Active Date',
        dataIndex: 'lastActiveDate',
        key: 'lastActiveDate',
        render: (value) => (
            <span>{formatUTCDateToLocalDate(value)}</span>
        )
    },
    {
        title: 'Account Status',
        key: 'accountStatus',
        dataIndex: 'status',
        sortDirections: ['descend', 'ascend'],
        render: (status: AccountStatus, user: UserDTO) => {
            let color = "";
            if (status == AccountStatus.Active) {
                color = "green";
            }
            if (status == AccountStatus.Banned) {
                color = "orange";
            }
            if (status == AccountStatus.Inactive) {
                color = "error";
            }
            return (
                <Tooltip title={() => {
                    if (!user.banReasons || !user.banReasons.length) {
                        return <>User is activating</>
                    }
                    return <>
                        Reasons: {user.banReasons?.join(", ")}
                        <br />
                        Ban Until: {formatUTCDateToLocalDate(user.banUntil || "")}
                    </>
                }}>
                    <Tag color={color} key={"status"} style={{ cursor: "default" }}>
                        {
                            AccountStatus[status].toString()
                        }
                    </Tag>
                </Tooltip>
            );
        }
    },
    {
        title: 'Online Status',
        key: 'onlineStatus',
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
                <Tag color={color} key={"status"} style={{ cursor: "default" }}>
                    {
                        status
                    }
                </Tag>
            );
        }
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
                <div className="user-roles-td">
                    {
                        data.map(d => (
                            <Tag color={d?.label.split("|")[1]} style={{ cursor: "default" }}>{d?.label.split("|")[0]}</Tag>
                        ))
                    }
                </div>
            )
        }
    }
];

const AdminPage: FC = () => {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [user, setUser] = useState<UserDTO>();
    const [currentUser, setCurrentUser] = useState<UserDTO>();
    const [allUsers, setAllUsers] = useState<Pagination<UserDTO>>();
    const [allBanReasons, setAllBanReasons] = useState<BanReasonDto[]>();
    const [loading, setLoading] = useState<boolean>(false);
    const [loginOpen, setLoginOpen] = useState<boolean>(false);
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isManager, setIsManager] = useState<boolean>(false);
    const [isModifying, setIsModifying] = useState<boolean>(false);
    const [savingUserInfo, setSavingUserInfo] = useState<boolean>(false);
    const [openNotificationPanel, setOpenNotificationPanel] = useState<boolean>(false);
    const [fetchingUser, setFetchingUser] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const [loginForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const checkAndGetAccessToken = async (): Promise<boolean> => {
        const accessibleRes = await access();
        if (accessibleRes.isSuccess) {
            const accessToken = getAuthToken();
            if (accessToken) {
                const isExp = isExpired();
                if (isExp) {
                    const oldTokens: TokenDto = {
                        accessToken: getAuthToken(),
                        refreshToken: getRefreshToken()
                    }
                    const newTokenRes = await authenticateUsingRefreshToken(oldTokens);
                    if (newTokenRes.isSuccess) {
                        setAuthToken(newTokenRes.responseData.accessToken);
                        setRefreshToken(newTokenRes.responseData.refreshToken);
                        return true;
                    } else {
                        removeAuthToken();
                        removeRefreshToken();
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        } else {
            addNewNotifications("The server is now unavailable, please try again later!", 'warning');
            return false;
        }
    }

    const addNewNotifications = (data: NotificationDto | NotificationDto[] | string | string[], type: "success" | "info" | "warning" | "error") => {
        if (Array.isArray(data)) {
            if (typeof data[0] === "string" && typeof data[0] !== "object") {
                const notificationMessages = data.map(d => {
                    const noti: NotificationDto = {
                        id: uuidv4(),
                        description: d.toString(),
                        type: type,
                        link: "",
                        seen: false
                    };
                    return noti;
                });
                setNotifications(prev => [...prev, ...notificationMessages]);
            } else {
                const newData: NotificationDto[] = [...data as NotificationDto[]];
                newData.forEach(d => {
                    d.type = type;
                    if (!d.id) {
                        d.id = uuidv4();
                    }
                });
                setNotifications(prev => [...prev, ...newData]);
            }
        } else {
            if (typeof data === "string") {
                const notiId = uuidv4();
                setNotifications(prev => [...prev, {
                    id: notiId,
                    description: data,
                    type: type,
                    seen: false,
                    link: ""
                }]);
            } else {
                const newData: NotificationDto = data as NotificationDto;
                newData.type = type;
                newData.id = newData.id || uuidv4();
                setNotifications(prev => [...prev, newData]);
            }
        }
    }

    const handleCloseErrorMessage = (id: string) => {
        const filteredNotifications = [...notifications].filter(p => p.id !== id);
        setNotifications(filteredNotifications);
        if (!filteredNotifications.length) setOpenNotificationPanel(false);
    }

    const logOut = async (): Promise<void> => {
        setLoading(true);
        const res = await logout();
        if (res.isSuccess) {
            setUser(undefined);
            removeAuthToken();
            removeRefreshToken();
            window.location.reload();
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        setLoading(false);
    }

    const getUserDetail = async (): Promise<void> => {
        setLoading(true);
        const checkingResult = await checkAndGetAccessToken();
        if (checkingResult) {
            const id = getTokenProperties("nameidentifier");
            const currentUserRes = await getUser(id);
            if (currentUserRes.isSuccess) {
                if (currentUserRes.responseData && currentUserRes.responseData.role && currentUserRes.responseData.role.length) {
                    setUser(currentUserRes.responseData);
                    const currentRoles = currentUserRes.responseData.role;
                    const isAdmin = currentRoles.some(cr => cr.name.toLowerCase() === "admin");
                    const isManager = currentRoles.some(cr => cr.name.toLowerCase() === "manager");
                    if (isAdmin) setIsAdmin(true);
                    if (isManager) setIsManager(true);
                    if (!isAdmin && !isManager) {
                        addNewNotifications("You have no permission to access this page", "warning");
                        setLoginOpen(true);
                    }
                } else {
                    addNewNotifications("You have no permission to access this page", "warning");
                    setLoginOpen(true);
                }
            } else {
                addNewNotifications(currentUserRes.errorMessage, "error");
            }
        } else {
            setLoginOpen(true);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!user) {
            getUserDetail();
        }
    }, []);

    const handleLogin = () => {
        loginForm
            .validateFields()
            .then(async (values) => {
                setLoginLoading(true);
                const result = await login(values);
                if (result.isSuccess && result.responseData) {
                    setLoginOpen(false);
                    setLoginLoading(false);
                    loginForm.resetFields();
                    setAuthToken(result.responseData.accessToken);
                    setRefreshToken(result.responseData.refreshToken);
                    getUserDetail();
                } else {
                    for (let it of result.errorMessage) {
                        api.error({
                            message: 'Login Failed',
                            description: it,
                            duration: -1,
                            placement: "top"
                        });
                    }
                    addNewNotifications(result.errorMessage, "error");
                    setLoginLoading(false);
                }
            })
            .catch((info) => {
                addNewNotifications(SystemString.ValidationError, "error");
                setLoginLoading(false);
            });
    }

    const getAllUsersForManagement = async (search?: string, page?: number, pageSize?: number): Promise<void> => {
        setFetchingUser(true);
        const res = await getAllUsers(search, page, pageSize);
        if (res.isSuccess) {
            setAllUsers(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        setFetchingUser(false);
    }

    const getAllBanReasons = async (): Promise<void> => {
        const res = await getBanReasons();
        if (res.isSuccess) {
            setAllBanReasons(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    useEffect(() => {
        if (isAdmin || isManager) {
            getAllUsersForManagement("", 1, 20);
            getAllBanReasons();
        }
    }, [isAdmin, isManager]);

    const handleDoubleClick = async (user: UserDTO): Promise<void> => {
        setFetchingUser(true);
        const res = await getUser(user.id);
        if (res.isSuccess) {
            setCurrentUser(res.responseData);
            setIsModifying(true);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        setFetchingUser(false);
    }

    const handleEditAUser = async (): Promise<void> => {
        editForm.validateFields().then(async (values) => {
            setSavingUserInfo(true);
            const data = values;
            const status = data.status;
            const roles = data.roles;
            let roleChanged = false;
            let statusChanged = false;

            if (user?.role.some(r => r.name === "manager") && currentUser?.role.some(r => r.name === "manager" || r.name === "admin")) {
                addNewNotifications("You have no permission to ban/inactive this user!", "warning");
                message.warning({
                    content: "You have no permission to ban/inactive this user!"
                });
                setSavingUserInfo(false);
                return;
            }

            if ((user?.role.some(r => r.name === "admin") && (!roles || !roles.length)) || status === null || status === undefined) {
                addNewNotifications("Missing Information!", "error");
                setSavingUserInfo(false);
                return;
            }
            if (status !== currentUser?.status) {
                statusChanged = true;
                if (status === AccountStatus.Banned || status === AccountStatus.Inactive) {
                    const reason = data.banReason;
                    const banTime = data.banTime;
                    const banTimeType = data.banTimeType;
                    if (!reason || !banTime || banTimeType === null || banTimeType === undefined) {
                        addNewNotifications("Missing Ban's Information!", "error");
                        setSavingUserInfo(false);
                        return;
                    } else {
                        const banReq: BanRequestDto = {
                            userId: currentUser?.id || "",
                            banTime: banTime,
                            timeType: banTimeType,
                            banIds: reason
                        }
                        const banRes = await banUser(banReq);
                        if (!banRes.isSuccess) {
                            addNewNotifications(banRes.errorMessage, "error");
                            setSavingUserInfo(false);
                            return;
                        }
                    }
                } else {
                    const unBanRes = await unBanUser(currentUser?.id || "");
                    if (!unBanRes.isSuccess) {
                        addNewNotifications(unBanRes.errorMessage, "error");
                        setSavingUserInfo(false);
                        return;
                    }
                }
            }

            if (roles.length !== currentUser?.role.length || !compareArray(roles, currentUser?.role.map(r => r.name) || [])) {
                roleChanged = true;
                const roleDto: SetRolesRequestDto = {
                    userId: currentUser?.id || "",
                    roles: roles.map((r: string) => {
                        return {
                            name: r
                        }
                    })
                };

                const setRoleRes = await setRoles(roleDto);
                if (!setRoleRes.isSuccess) {
                    addNewNotifications(setRoleRes.errorMessage, "error");
                    setSavingUserInfo(false);
                    return;
                }
            }
            if (roleChanged || statusChanged) {
                message.success({
                    content: "Saved"
                });
                await getAllUsersForManagement("", 1, 20);
                setIsModifying(false);
            } else {
                message.warning({
                    content: "Nothing changed!"
                });
            }
            setSavingUserInfo(false);
        }).catch((error) => {
            message.error({
                content: error
            });
        });

    }

    const handleSelectStatus = async (value: AccountStatus): Promise<void> => {
        if (value === AccountStatus.Banned || value === AccountStatus.Inactive) {
            const res = await getBanReasons();
            if (res.isSuccess) {
                setAllBanReasons(res.responseData);
            } else {
                addNewNotifications(res.errorMessage, "error");
            }
        }
    }

    const handleWhenSearchUser = async (value: string, event?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>, info?: {
        source?: 'clear' | 'input';
    }): Promise<void> => {
        if (value && info?.source === "input") {
            await getAllUsersForManagement(value, 1, 20);
        }

        if (info?.source === "clear") {
            await getAllUsersForManagement("", 1, 20);
        }
    }

    const handleWhenUserPaginationChange = async (page: number, pageSize: number): Promise<void> => {
        await getAllUsersForManagement("", page, pageSize);
    }

    return (
        <div>
            {contextHolder}
            <div className="header-panel">
                <div className="header">
                    <div className="author">
                        <div>
                            <Avatar src={<img src="app-logo.PNG" alt='app-logo' style={{ width: "100%", height: "100%" }} />} style={{ verticalAlign: 'middle', boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }} size={40} />
                        </div>

                        <div className="link-to">
                            Powered by
                            <a href="https://www.hieuduongit.com/" target='_blank' rel="noreferrer"> HieuduongIT.com</a>
                        </div>
                    </div>
                    <div className="notifications">
                        {notifications[notifications.length - 1] ?
                            <Alert
                                key={notifications[notifications.length - 1].id}
                                banner
                                closable
                                message={<div style={{ width: "100%" }} onClick={() => setOpenNotificationPanel(true)}>{notifications[notifications.length - 1].description}</div>}
                                type={notifications[notifications.length - 1].type}
                                onClose={() => handleCloseErrorMessage(notifications[notifications.length - 1].id || "")}
                            />
                            :
                            <></>
                        }
                    </div>

                    <Badge count={notifications.length} size='small' style={{ cursor: "pointer" }} >
                        <Button type="default" shape="circle" size='large' danger={!!notifications.length} icon={<AlertOutlined />} onClick={() => setOpenNotificationPanel(prev => !prev)} />
                    </Badge>
                    {
                        user ? <div className='profile'>
                            <Popover placement="bottomLeft" title={""} content={
                                <div style={{ display: "flex", flexDirection: "column", flexWrap: "nowrap", justifyContent: "center", alignItems: "center" }}>
                                    <div>Hello {user.userName}</div>
                                    <Button type="link">Your profile</Button>
                                    <Button type="dashed" onClick={logOut}>Log out</Button>
                                </div>
                            } trigger="click">
                                <Avatar style={{ verticalAlign: 'middle', cursor: "pointer", backgroundColor: "#87d068" }} className='user-profile' size={40} gap={2}>
                                    {generateShortUserName(user.userName)}
                                </Avatar>
                            </Popover>

                        </div>
                            :
                            <div className='profile'>
                                <Avatar src={<img src="favicon.png" alt='profile' style={{ width: "100%", height: "100%" }} />} size={40} style={{ verticalAlign: 'middle' }} />
                            </div>
                    }
                </div>
            </div>
            {
                loading ?
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 50 }} spin />} fullscreen />
                    :
                    isAdmin || isManager ?
                        <div className='admin-page'>
                            <div className="admin-container">
                                <Table
                                    title={() => (<Search className="input-search-user" addonBefore={<UserOutlined size={22} />} placeholder="Type the user's name" allowClear size="large" onSearch={handleWhenSearchUser} />)}
                                    columns={columns}
                                    dataSource={allUsers?.items?.filter(u => u.id !== user?.id)}
                                    bordered
                                    scroll={{ y: 550 }}
                                    rowKey={(record) => record.id}
                                    onRow={(record) => {
                                        return {
                                            onDoubleClick: (event) => handleDoubleClick(record)
                                        }
                                    }}
                                    loading={fetchingUser}
                                    pagination={{ position: ["bottomRight"], pageSize: allUsers?.pageSize, current: allUsers?.currentPage, total: allUsers?.totalRecords, onChange: handleWhenUserPaginationChange }}
                                />
                            </div>

                        </div>
                        :
                        <></>
            }
            <Drawer
                title="Notifications"
                placement="right"
                width={400}
                onClose={() => setOpenNotificationPanel(false)}
                open={openNotificationPanel}
                extra={
                    <Space>
                        <Button type="link" onClick={() => {
                            setNotifications([]);
                            setOpenNotificationPanel(false);
                        }}>
                            Dismiss All
                        </Button>
                    </Space>
                }
            >
                <div className='list-errors'>
                    {
                        notifications.map(nt => {
                            return (
                                <Alert
                                    key={nt.id}
                                    banner
                                    closable
                                    message={nt.description}
                                    type={nt.type}
                                    onClose={() => handleCloseErrorMessage(nt.id || "")}
                                />
                            )
                        })
                    }
                </div>
            </Drawer>
            <Modal
                open={loginOpen}
                title="Login"
                okText="Login"
                cancelText="Cancel"
                onCancel={() => { setLoginOpen(false); setLoginLoading(false); }}
                onOk={handleLogin}
                confirmLoading={loginLoading}
                okButtonProps={{ htmlType: "submit" }}
            >
                <Form
                    form={loginForm}
                    layout="horizontal"
                    name="login-form"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    onKeyDown={(e) => {
                        if (e.code && e.code.includes('Enter')) {
                            handleLogin();
                        }
                    }}
                >
                    <Form.Item
                        name="username"
                        label="User Name"
                        rules={[{ required: true, message: 'Please input your username' }]}
                    >
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please input your password' }]}
                    >
                        <Input.Password type="password" />
                    </Form.Item>
                    <Form.Item
                        name="remember"
                        valuePropName="checked"
                        wrapperCol={{ offset: 8, span: 16 }}
                    >
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                open={isModifying}
                title={`Editing ${currentUser?.userName}`}
                okText="Save"
                cancelText="Cancel"
                onCancel={() => {
                    setSavingUserInfo(false);
                    setIsModifying(false);
                    setCurrentUser(undefined);
                    editForm.resetFields();
                }}
                onOk={handleEditAUser}
                confirmLoading={savingUserInfo}
                okButtonProps={{ htmlType: "submit" }}
                width={800}
                afterClose={() => {
                    editForm.resetFields();
                }}
                destroyOnClose={true}
            >
                <Form
                    form={editForm}
                    style={{ width: "100%" }}
                    name="edit-form"
                    onKeyDown={(e) => {
                        if (e.code && e.code.includes('Enter')) {
                            handleEditAUser();
                        }
                    }}
                >
                    {user?.role.some(r => r.name.toLowerCase() === "admin") ?
                        <Form.Item
                            name={"roles"}
                            label="Roles"
                            initialValue={Roles.filter(r => currentUser?.role.find(rl => rl.name === r.value)).map(r => r.value)}
                            rules={[{ required: true, message: 'Please select the roles', type: "array" }]}
                        >
                            <Select
                                mode="multiple"
                                tagRender={tagRender}
                                style={{ width: "100%", minWidth: 200 }}
                                options={Roles}
                                optionRender={(option) => {
                                    let newLabel = "";
                                    if (typeof option.label === "string") {
                                        newLabel = option.label?.split("|")[0];
                                    }
                                    return <>{newLabel}</>
                                }
                                }
                            />
                        </Form.Item> : <></>}
                    <Form.Item
                        name={"status"}
                        label="Status"
                        initialValue={currentUser?.status}
                        rules={[{ required: true, message: 'Please select the Status' }]}
                    >
                        <Select onSelect={(value) => handleSelectStatus(value)} defaultValue={currentUser?.status}>
                            <Select.Option value={AccountStatus.Active}>Active</Select.Option>
                            <Select.Option value={AccountStatus.Inactive}>InActive</Select.Option>
                            <Select.Option value={AccountStatus.Banned}>Banned</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues: any, currentValues: any) => prevValues.status !== currentValues.status}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('status') !== AccountStatus.Active ? (
                                <Form.Item
                                    name={"banReason"}
                                    label="Ban Reason"
                                    rules={[{ required: true, type: "array", message: 'Please select the Ban reasons' }]}
                                    hasFeedback
                                    initialValue={allBanReasons?.filter(ab => currentUser?.banReasons?.find(ubr => ubr === ab.reason)).map(r => r.id)}
                                >
                                    <Select mode='multiple'>
                                        {
                                            allBanReasons?.map(reason => (
                                                <Select.Option value={reason.id}>{reason.reason}</Select.Option>
                                            ))
                                        }
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues: any, currentValues: any) => prevValues.status !== currentValues.status}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('status') !== AccountStatus.Active ? (
                                <Form.Item
                                    name={"banTime"}
                                    label="Ban Time"
                                    initialValue={1}
                                    rules={[
                                        { required: true, message: 'Please select the Time', type: "number" }
                                    ]}
                                    hasFeedback
                                >
                                    <InputNumber min={1} max={9999} />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues: any, currentValues: any) => prevValues.status !== currentValues.status}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('status') !== AccountStatus.Active ? (
                                <Form.Item
                                    name={"banTimeType"}
                                    label="Time Type"
                                    initialValue={TimeType.Minute}
                                    rules={[{ required: true, message: 'Please select the Ban Time Type' }]}
                                    hasFeedback
                                >
                                    <Select>
                                        <Select.Option value={TimeType.Minute}>Minute</Select.Option>
                                        <Select.Option value={TimeType.Hour}>Hour</Select.Option>
                                        <Select.Option value={TimeType.Day}>Day</Select.Option>
                                        <Select.Option value={TimeType.Month}>Month</Select.Option>
                                        <Select.Option value={TimeType.Year}>Year</Select.Option>
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
export default AdminPage;