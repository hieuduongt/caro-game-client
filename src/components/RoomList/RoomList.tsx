import { FC, useContext, useEffect, useState } from "react";
import './RoomList.css';
import { Modal, Form, Button, List, Input, notification } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { PlusOutlined } from '@ant-design/icons';
import { ResponseData, RoomDTO, UserDTO } from "../../models/Models";
import { createRoom, getAllRooms } from "../../services/RoomServices";
import { StepContext, UserContext } from "../../helpers/Context";
import { getTokenProperties } from "../../helpers/Helper";
const { Search } = Input;

interface RoomListProps extends React.HTMLAttributes<HTMLDivElement> {

}

const RoomList: FC<RoomListProps> = (props) => {
    const [roomCreationForm] = Form.useForm<RoomDTO>();
    const [step, setStep] = useContext(StepContext);
    const { setRedirectToLogin, connection } = useContext(UserContext);
    const [listRooms, setListRooms] = useState<RoomDTO[]>();
    const [listUsers, setListUsers] = useState<UserDTO[]>();
    const [openCreateRoom, setOpenCreateRoom] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification()

    const getListRooms = async (): Promise<void> => {
        const res = await getAllRooms();
        console.log(res.responseData)
        if (res.isSuccess == true) {
            setListRooms(res.responseData.items);
        }
        if (res.isSuccess == false && res.code == 401) {
            setStep(1);
            setRedirectToLogin(true);
        }
    }

    useEffect(() => {
        getListRooms();
    }, []);

    useEffect(() => {
        if (connection) {
            connection.on("RoomCreated", async (mess: string) => {
                console.log(mess);
                await getAllRooms();
            });
        }
    }, [connection]);

    const handleCreate = () => {
        roomCreationForm
            .validateFields()
            .then(async (values) => {
                setIsCreating(true);
                console.log(values);
                const result = await createRoom(values);
                if (result.code === 200 && result.isSuccess) {
                    roomCreationForm.resetFields();
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
                        size="small"
                        bordered
                        dataSource={listRooms||[]}
                        renderItem={(item) => <List.Item>{item.name}</List.Item>}
                    />
                </div>
                <div className="list-users">
                    <List
                        size="small"
                        bordered
                        dataSource={[]}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
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