import { FC, useContext, useState } from "react";
import { Button, Flex, Form, Input, Modal, Checkbox, notification } from 'antd';
import { LoginOutlined, UserAddOutlined, RobotOutlined, WarningOutlined } from '@ant-design/icons';
import './Home.css';
import { StepContext } from "../../helpers/Context";
import { getAllUsers, login, register } from "../../services/authServices";

interface HomeProps extends React.HTMLAttributes<HTMLDivElement> {

}

const Home: FC<HomeProps> = (props) => {
    const [api, contextHolder] = notification.useNotification();
    const [step, setStep] = useContext(StepContext);
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [openLoginForm, setOpenLoginForm] = useState<boolean>(false);
    const [openRegisterForm, setOpenRegisterForm] = useState<boolean>(false);

    const handleLogin = () => {
        loginForm
            .validateFields()
            .then(async (values) => {
                const result = await login(values);
                if (result.code === 200 && result.isSuccess) {
                    loginForm.resetFields();
                    sessionStorage.setItem("authToken", result.responseData);
                    setStep(2);
                    setOpenLoginForm(false);
                } else {
                    for (let it of result.errorMessage) {
                        api.error({
                            message: 'Login Failed',
                            description: it,
                            duration: -1,
                            placement: "top"
                        })
                    }
                }
            })
            .catch((info) => { });
    }

    const handleRegister = () => {
        registerForm
            .validateFields()
            .then(async (values) => {
                const result = await register(values);
                if (result.code === 200 && result.isSuccess) {
                    registerForm.resetFields();
                    loginForm.setFieldsValue({
                        username: values.username,
                        password: values.password
                    });
                    setOpenLoginForm(true);
                    setOpenRegisterForm(false);
                } else {
                    // for (let it of result.errorMessage) {
                    //     api.error({
                    //         message: 'Register Failed',
                    //         description: it,
                    //         duration: -1,
                    //         placement: "top"
                    //     })
                    // }
                    api.error({
                        message: 'Register Failed',
                        description: result.errorMessage,
                        duration: -1,
                        placement: "top"
                    })
                }
            })
            .catch((info) => { });
    }
    const testApi = async () => {
        const res = await getAllUsers(1, 20);
        console.log(res)
        api.error({
            message: 'Register Failed',
            description: res.errorMessage,
            duration: -1,
            placement: "top"
        })
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
                    <Button type="dashed" icon={<RobotOutlined />} size={"large"} onClick={() => testApi()}>
                        Play as guest
                    </Button>
                </Flex>
            </div>

            <div className="game-introducing">
                Hey man
            </div>
            <Modal
                open={openLoginForm}
                title="Login"
                okText="Login"
                cancelText="Cancel"
                onCancel={() => setOpenLoginForm(false)}
                onOk={handleLogin}
            >
                <Form
                    form={loginForm}
                    layout="horizontal"
                    name="login-form"
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
                onCancel={() => setOpenRegisterForm(false)}
                onOk={handleRegister}
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