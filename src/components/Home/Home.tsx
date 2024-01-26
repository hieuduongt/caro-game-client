import { FC, useContext, useEffect, useState } from "react";
import { Button, Flex, Form, Input, Modal, Checkbox, notification } from 'antd';
import { LoginOutlined, UserAddOutlined, RobotOutlined } from '@ant-design/icons';
import './Home.css';
import { StepContext, UserContext } from "../../helpers/Context";
import { login, register } from "../../services/AuthServices";
import { getAllRooms } from "../../services/RoomServices";
import { getAuthToken, getTokenProperties, setAuthToken } from "../../helpers/Helper";
import { UserDTO } from "../../models/Models";
import { getUser } from "../../services/UserServices";
import * as signalR from "@microsoft/signalr";

interface HomeProps extends React.HTMLAttributes<HTMLDivElement> {
    redirectToLogin?: boolean;
    checkIsLoggedIn: () => void;
    connectToGameHub: () => void;
}

const Home: FC<HomeProps> = (props) => {
    const { redirectToLogin, checkIsLoggedIn, connectToGameHub } = props;
    const [api, contextHolder] = notification.useNotification();
    const { setUser, setConnection } = useContext(UserContext);
    const [step, setStep] = useContext(StepContext);
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [openLoginForm, setOpenLoginForm] = useState<boolean>(false);
    const [loggingIn, setLoggingIn] = useState<boolean>(false);
    const [openRegisterForm, setOpenRegisterForm] = useState<boolean>(false);
    const [registering, setRegistering] = useState<boolean>(false);

    useEffect(() => {
        if (redirectToLogin) {
            setOpenLoginForm(true);
        } else {
            setOpenLoginForm(false);
        }
    }, [redirectToLogin]);

    const handleLogin = () => {
        loginForm
            .validateFields()
            .then(async (values) => {
                setLoggingIn(true);
                const result = await login(values);
                if (result.code === 200 && result.isSuccess) {
                    loginForm.resetFields();
                    setAuthToken(result.responseData);
                    connectToGameHub();
                } else {
                    for (let it of result.errorMessage) {
                        api.error({
                            message: 'Login Failed',
                            description: it,
                            duration: -1,
                            placement: "top"
                        })
                    }
                    setLoggingIn(false);
                }
            })
            .catch((info) => {
                setLoggingIn(false);
            });
    }

    const handleRegister = () => {
        registerForm
            .validateFields()
            .then(async (values) => {
                setRegistering(true);
                const result = await register(values);
                if (result.code === 200 && result.isSuccess) {
                    registerForm.resetFields();
                    loginForm.setFieldsValue({
                        username: values.username,
                        password: values.password
                    });
                    setOpenLoginForm(true);
                    setOpenRegisterForm(false);
                    setRegistering(false);
                } else {
                    for (let it of result.errorMessage) {
                        api.error({
                            message: 'Register Failed',
                            description: it,
                            duration: -1,
                            placement: "top"
                        })
                    }
                    setRegistering(false);
                }
            })
            .catch((info) => {
                setRegistering(false);
            });
    }

    return (
        <div className='home'>
            {contextHolder}
            <div className="home-action">
                <Flex gap="small" wrap="wrap">
                    <Button type="primary" icon={<LoginOutlined />} size={"large"} onClick={() => setOpenLoginForm(true)}>
                        Login
                    </Button>
                    <Button type="default" icon={<UserAddOutlined />} size={"large"} onClick={() => setOpenRegisterForm(true)}>
                        Register
                    </Button>
                    <Button type="dashed" icon={<RobotOutlined />} size={"large"} onClick={() => { }}>
                        Play as guest
                    </Button>
                </Flex>
            </div>

            <div className="game-introducing">
                <div className="game-description">
                    - Caro, also known as Gomoku+, was the oldest logic board game in the world. <br />
                    - The game has extremely simple rules but requires careful tactics, which makes Caro well-loved by many people, especially students and office workers.<br />
                    - Caro isn’t just pure entertainment but an exciting intellectual battle, helping to train logical thinking and increase your IQ. <br />
                    - Join Caro and beat the opponents to show your level.<br />
                    ⁂ How to play:<br />
                    - Each player uses an X or O letter, which are Caro pieces.<br />
                    - The players will in turn fill the grid with their letter.<br />
                    - The winner is the person who gets 5 in a row (horizontal, vertical, or diagonal) first.
                </div>
                <div className="game-images">
                    <img src="caro.png" alt="" />
                </div>
            </div>
            <Modal
                open={openLoginForm}
                title="Login"
                okText="Login"
                cancelText="Cancel"
                onCancel={() => { setOpenLoginForm(false); setLoggingIn(false); }}
                onOk={handleLogin}
                confirmLoading={loggingIn}
                okButtonProps={{ htmlType: "submit" }}
            >
                <Form
                    form={loginForm}
                    layout="horizontal"
                    name="login-form"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    onKeyDown={(e) => {
                        console.log(e.code)
                        if(e.code === 'Enter') {
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
                open={openRegisterForm}
                title="Create a new Account"
                okText="Register"
                cancelText="Cancel"
                onCancel={() => { setOpenRegisterForm(false); setRegistering(false); }}
                onOk={handleRegister}
                confirmLoading={registering}
                okButtonProps={{ htmlType: "submit" }}
            >
                <Form
                    form={registerForm}
                    layout="horizontal"
                    name="register-form"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                >
                    <Form.Item
                        name="username"
                        label="User Name"
                        rules={[{ required: true, message: 'Please input your username' }]}
                    >
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Please input your email' }]}
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
                        name="rePassword"
                        label="Retype Your Password"
                        rules={[{ required: true, message: 'Please input your password again' }]}
                    >
                        <Input.Password type="password" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default Home;