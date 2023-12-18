import { FC, useContext } from 'react';
import './GameMenu.css';
import { Button, Form, Input, Flex } from 'antd';
import { AiOutlineSend } from "react-icons/ai";
import { UserContext } from '../../helpers/Context';
import { RoomDTO } from '../../models/Models';
import { getTokenProperties } from '../../helpers/Helper';

interface GameMenuProps extends React.HTMLAttributes<HTMLDivElement> {

}

const GameMenu: FC<GameMenuProps> = (props) => {
    const { connection, roomInfo } = useContext(UserContext);
    const onFinish = (values: any) => {
        console.log('Success:', values);
    };

    type FieldType = {
        message?: string;
    };

    const handleWhenLeave = () => {
        const yourId = getTokenProperties("nameidentifier");

        const data: RoomDTO = {};
        connection.invoke("UserLeaved", data);
    }

    return (
        <div className='game-menu'>
            <Flex wrap="wrap" gap="small">
                <Button type="primary" danger onClick={handleWhenLeave}>
                    Leave
                </Button>
            </Flex>
            <div className='players'>
                <div className='player'>
                    <div className='player-title'>You</div>
                    <div className='player-info'>
                        <div className='info'>
                            <div className='avatar'>
                                <img src="human.jpg" alt="" />
                            </div>
                            <div className='player-name'>Hieu</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Number of wins: 100</div>
                            <div className='number-of-losses'>Number of losses: 0</div>
                        </div>
                    </div>
                </div>
                <div className='player'>
                    <div className='player-title'>Your Competitor</div>
                    <div className='player-info'>
                        <div className='info'>
                            <div className='avatar'>
                                <img src="human.jpg" alt="" />
                            </div>
                            <div className='player-name'>tHieu</div>
                        </div>
                        <div className='competition-history-info'>
                            <div className='number-of-wins'>Number of wins: 100</div>
                            <div className='number-of-losses'>Number of losses: 0</div>
                        </div>
                    </div>
                </div>

            </div>
            <div className='chat-area'>
                <div className='chat-title'>Chat</div>
                <div className='chat-content'>
                    <div className='chat-messages'>
                        <div className='my-message'>
                            <b>Hieu: </b>hello everyone khsdfkahsfliahfailfjiowuro kjahfjkahsksakj kjfhskfhskjskjsdkjskdgsj sgkjhssdkjsksjdkkdjksdkj
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='my-message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
                        <div className='message'>
                            <b>Hieu: </b>hello everyone
                        </div>
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