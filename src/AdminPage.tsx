import { Alert, Avatar, Badge, Button, Checkbox, Drawer, Form, Input, Modal, Popover, Space, Spin, notification } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import { LoadingOutlined, AlertOutlined, MessageOutlined } from '@ant-design/icons';
import { NotificationDto, Pagination, TokenDto, UserDTO } from './models/Models';
import { access, authenticateUsingRefreshToken, logout } from './services/AuthServices';
import { generateShortUserName, getAuthToken, getRefreshToken, getTokenProperties, isExpired, removeAuthToken, removeRefreshToken, setAuthToken, setRefreshToken } from './helpers/Helper';
import { v4 as uuidv4 } from 'uuid';
import { getAllUsers, getUser } from './services/UserServices';
import { login } from './services/AuthServices';
import { SystemString } from './common/StringHelper';

const AdminPage: FC = () => {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [user, setUser] = useState<UserDTO>();
    const [allUsers, setAllUsers] = useState<Pagination<UserDTO>>();
    const [loading, setLoading] = useState<boolean>(false);
    const [loginOpen, setLoginOpen] = useState<boolean>(false);
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isManager, setIsManager] = useState<boolean>(false);
    const [openNotificationPanel, setOpenNotificationPanel] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();
    const [loginForm] = Form.useForm();

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
        const res = await getAllUsers(search, page, pageSize);
        if(res.isSuccess) {
            setAllUsers(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    useEffect(() => {
        if(isAdmin || isManager) {
            getAllUsersForManagement("", 1, 20);
        }
    }, [isAdmin, isManager]);

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
        </div>
    )
}
export default AdminPage;