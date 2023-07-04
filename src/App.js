import './App.css';
import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Button, Form, Input, InputNumber, message, Alert, Statistic, Modal, List } from 'antd';
import { PlaySquareOutlined, SendOutlined, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import ChatServices from './API/chatServices';
import ConnectionServices from './API/connectionServices';
const { Countdown } = Statistic;

const XIcon = () => {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" className="bi bi-x-lg text-dark" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" /></svg>)
};

const OIcon = () => {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" className="bi bi-circle text-danger" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" /></svg>)
};

const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" class="bi bi-x-lg text-dark" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
const oIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" class="bi bi-circle text-danger" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>`

const Row = (props) => {
  return (<tr>{props.children}</tr>)
}

const Cell = (props) => {
  return (<td className='cell' coordinates={`${props.x},${props.y}`} onClick={props.onClick}></td>)
}

function App() {
  const [myConnectionId, setMyConnectionId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [connection, setConnection] = useState(null);
  const [yourProfile, setYourProfile] = useState("Bot");
  const [competitor, setCompetitor] = useState();
  const [messages, setMessages] = useState([]);
  const [chatToggle, setChatToggle] = useState(false);
  const [xGridSize, setXGridSize] = useState([]);
  const [yGridSize, setYGridSize] = useState([]);
  const [gameboard, setGameBoard] = useState([]);
  const [listPlayers, setListPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deadline, setDeadLine] = useState(Date.now() + 60 * 1000);
  const [form] = Form.useForm();
  const [messageForm] = Form.useForm();
  const [nameForm] = Form.useForm();

  const prepairGrid = (x, y) => {
    let gridX = [];
    let gridY = [];
    let board = [];
    for (let i = 0; i < x; i++) {
      gridX.push(i);
    }
    for (let i = 0; i < y; i++) {
      gridY.push(i);
    }
    for (let xIndex = 0; xIndex < x; xIndex++) {
      board[xIndex] = [];
      for (let yIndex = 0; yIndex < y; yIndex++) {
        board[xIndex][yIndex] = "";
      }
    }
    setXGridSize(gridX);
    setYGridSize(gridY);
    setGameBoard(board);
  }

  const setUserName = (name) => {
    connection.send('SetUserName', name); // Gửi userName cho API server
  }

  const fetchListPlayers = async () => {
    const res = await ConnectionServices.getFreeOnly();
    if (res.status === 200) {
      setListPlayers(res.data.results);
    }
    return res.data.results;
  }

  useEffect(() => {
    fetchListPlayers();
    prepairGrid(100, 100);
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://caro-game-server-19011997.azurewebsites.net/api/chat')
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to SignalR Hub');
        setConnection(connection);
        setMyConnectionId(connection.connectionId);
      })
      .catch((error) => {
        console.error(error);
      });
    connection.on("ReceiveMessage", async (user, mess) => {
      console.log(user, mess);

      if (user.toLowerCase() === "new-user-login") {
        fetchListPlayers();
      } else {
        const listPlayers = await fetchListPlayers();
        setCompetitor(listPlayers.find(i => i.id == user));
        setMessages(oldMessage => [...oldMessage, {
          isYourMessage: false,
          content: mess
        }]);
      }
    });
    // Cleanup: Đóng kết nối khi component unmount
    return () => {
      connection.stop();
    };
  }, []);

  const cellClick = (e, x, y) => {
    if (!e || !e.target || e.target.nodeName.toLowerCase() !== "td") return;
    if (e.target.getAttribute("selected")) return;
    e.target.innerHTML = oIcon;
    e.target.setAttribute("selected", "true");
    gameboard[x][y] = currentPlayer;
    setDeadLine(Date.now() + 60 * 1000);
  }

  const submitControl = () => {
    const x = form.getFieldValue("gridX");
    const y = form.getFieldValue("gridY");
    if (x == null || y == null) return;
    prepairGrid(x, y);
    message.success(`Grid is now ${x}x${y}`);
  }

  const createRoom = (item) => {
    setCompetitor(item);
  }

  const onSendMessage = async () => {
    const mess = messageForm.getFieldValue("message");
    if (!mess) return;
    const res = await ChatServices.sendToOne(competitor.id, myConnectionId, mess);
    if (res.status !== 200) {
      message.error("Cannot send your message! try again!");
    } else {
      messageForm.resetFields();
      setMessages(oldMessage => [...oldMessage, {
        isYourMessage: true,
        content: mess
      }]);
    }
  }

  const handleOk = (values) => {
    setUserName(values.name);
    setIsModalOpen(false);
  };

  return (
    <div className="App">
      <Modal
        open={isModalOpen}
        title="Type your name"
        okText="Create"
        onOk={() => {
          nameForm
            .validateFields()
            .then((values) => {
              nameForm.resetFields();
              handleOk(values);
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
      >
        <Form
          form={nameForm}
          layout="vertical"
          name="form_in_modal"
          initialValues={{
            modifier: 'public',
          }}
        >
          <Form.Item
            name="name"
            label="Your name"
            rules={[
              {
                required: true,
                message: 'Please input your name!',
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      {
        competitor || messages.length ?
          <>
            {
              chatToggle ?
                <div className='chat-card'>
                  <div className='chat-header'>
                    <div className='chat-title'>
                      {competitor && competitor.userName ? competitor.userName : "No name"}
                    </div>
                    <div className='chat-icon-action' onClick={() => setChatToggle(!chatToggle)}>
                      <CaretDownOutlined />
                    </div>
                  </div>
                  <div className='chat-content'>
                    {
                      messages.map(m => {
                        return m.isYourMessage ?
                          (
                            <div className='message-row'>
                              <div className='my-messages'>
                                {m.content}
                              </div>

                            </div>
                          ) :
                          (
                            <div className='message-row'>
                              <div className='friend-messages'>
                                {m.content}
                              </div>
                            </div>
                          )
                      }
                      )
                    }
                  </div>
                  <div className='chat-action'>
                    <Form
                      onFinish={onSendMessage}
                      layout='inline'
                      form={messageForm}
                    >
                      <Form.Item
                        name={"message"}
                        style={{ width: "100%" }}
                      >
                        <Input style={{ width: "100%", border: "none", boxShadow: "none" }} size='large' placeholder="Type your message" prefix={<SendOutlined />} />
                      </Form.Item>
                    </Form>
                  </div>
                </div> :
                <div className='chat-card-closed'>
                  <div className='chat-header'>
                    <div className='chat-title'>
                      {competitor && competitor.userName ? competitor.userName : "No name"}
                    </div>
                    <div className='chat-icon-action' onClick={() => setChatToggle(!chatToggle)}>
                      <CaretUpOutlined />
                    </div>
                  </div>
                </div>
            }
          </> : <>
          </>
      }

      <div className="control">
        <Form
          onFinish={submitControl}
          layout='inline'
          form={form}
        >
          <Form.Item
            label="Grid X"
            name={"gridX"}
            rules={[
              {
                pattern: /^[0-9]+$/,
                message: "Only number is accepted!"
              }
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={9} max={200} placeholder="Max: 200, Min: 9, Default: 100" />
          </Form.Item>
          <Form.Item
            name={"gridY"}
            label="Grid Y"
            rules={[
              {
                pattern: /^[0-9]+$/,
                message: "Only number is accepted!"
              }
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={9} max={200} placeholder="Max: 200, Min: 9, Default: 100" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Submit</Button>
          </Form.Item>
        </Form>
      </div>
      <div className='list-players'>
        <List
          style={{
            margin: "30px",
            width: "500px"
          }}
          size="large"
          header={<div>List online players</div>}
          bordered
          dataSource={listPlayers}
          renderItem={(item) => {
            if (item.id !== myConnectionId) {
              return (
                <List.Item>
                  <Button type="dashed" size='small' icon={<PlaySquareOutlined />} onClick={() => createRoom(item)}>Play</Button>
                  <div>
                    {item.userName ? item.userName : "No name"}
                  </div>
                  <div className='player-status'>
                    Online
                  </div>
                </List.Item>
              )
            } else {
              return <></>
            }
          }}
        />
      </div>

      {
        !competitor ?
          <div className="control">
            <Button type="primary" size='large' icon={<PlaySquareOutlined />} onClick={createRoom}>Play</Button>
          </div>
          :
          <div>
            <div className="control">
              <Alert message={"You are:"} type="info" style={{ marginRight: "20px", height: "82px" }} description={<XIcon />} />
              <Alert message={<span> <Countdown title="Your turn:" value={deadline} format="ss" /></span>} type="warning" />
            </div>
            <div class="grid">
              <table id="game" >
                {
                  yGridSize.map(y => (
                    <Row>
                      {
                        xGridSize.map(x => (
                          <Cell x={x} y={y} onClick={(e) => cellClick(e, x, y)} />
                        ))
                      }
                    </Row>
                  ))
                }
              </table>
            </div>
          </div>
      }
    </div>
  );
}

export default App;
