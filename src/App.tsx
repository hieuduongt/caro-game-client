import { FC, useEffect, useRef, useState } from 'react';
import './App.css';
import { notification, Spin, Popover, Button, Avatar, Affix, Collapse, Input } from 'antd';
import { LoadingOutlined, SendOutlined, CloseCircleOutlined, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import * as signalR from "@microsoft/signalr";
import { AppContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import RoomList from './components/RoomList/RoomList';
import { EnvEnpoint, formatUTCDateToLocalDate, generateShortUserName, getAuthToken, getTokenProperties, isExpired, removeAuthToken } from './helpers/Helper';
import { getUser } from './services/UserServices';
import { Coordinates, MatchDTO, Message, MessageDto, MessageQueue, RoomDTO, UserDTO } from './models/Models';
import { getMessage, sendMessageToUser } from './services/ChatServices';
const { Search } = Input;

const App: FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [isConnected, setConnected] = useState<boolean>(false);
  const [yourTurn, setYourTurn] = useState<boolean>(false);
  const [newGame, setNewGame] = useState<number>(0);
  const [start, setStart] = useState<boolean>(false);
  const [watchMode, setWatchMode] = useState<boolean>(false);
  const cLoaded = useRef<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [step, setStep] = useState<number>(0);
  const [user, setUser] = useState<UserDTO>();
  const [redirectToLogin, setRedirectToLogin] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<RoomDTO>();
  const [matchInfo, setMatchInfo] = useState<MatchDTO>();
  const [listCoordinates, setListCoordinates] = useState<Coordinates[]>();
  const [messageQueue, setMessageQueue] = useState<MessageQueue[]>([]);
  const [newReceivedMessage, setNewReceivedMessage] = useState<MessageDto>();
  const messageRefs = useRef<Array<HTMLDivElement>>([]);

  const checkIsLoggedIn = async (): Promise<void> => {
    setLoading(true);
    const token = getAuthToken();
    if (token) {
      const isExp = isExpired();
      if (isExp) {
        removeAuthToken();
        setRedirectToLogin(true);
        setStep(1);
        setLoading(false);
      } else {
        await connectToGameHub();
      }
    } else {
      setStep(1);
      setLoading(false);
    }
  }

  const connectToGameHub = async () => {
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${EnvEnpoint()}/connection/hub/game`, {
        accessTokenFactory: () => getAuthToken(),
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: true
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Debug)
      .build();
    hubConnection.start().then(() => {
      setConnection(hubConnection);
      setConnected(true);
    }).catch((error) => {
      api.error({
        message: 'Connect Failed',
        description: "Cannot connect to server with error: " + error.toString(),
        duration: -1,
        placement: "top"
      });
    });
  }

  const checkIfIsInRoom = async (): Promise<boolean> => {
    const id = getTokenProperties("nameidentifier");
    const res = await getUser(id);
    if (res.isSuccess && res.responseData) {
      const currentUser: UserDTO = {
        id: res.responseData.id,
        userName: res.responseData.userName,
        roomId: res.responseData.roomId,
        email: res.responseData.email,
        isRoomOwner: res.responseData.isRoomOwner,
        role: res.responseData.role,
        sitting: res.responseData.sitting,
        status: res.responseData.status,
        createdDate: res.responseData.createdDate,
        isEditBy: res.responseData.isEditBy,
        lastActiveDate: res.responseData.lastActiveDate,
        isPlaying: res.responseData.isPlaying,
        isOnline: res.responseData.isOnline,
        connectionId: res.responseData.connectionId,
        loseMatchs: res.responseData.loseMatchs,
        numberOfMatchs: res.responseData.numberOfMatchs,
        winMatchs: res.responseData.winMatchs
      }
      setUser(currentUser);
      return res.responseData.roomId ? true : false;
    }
    return false;
  }

  const logOut = (): void => {
    setUser(undefined);
    removeAuthToken();
    setStep(1);
    connection?.stop();
    setConnected(false);
    setConnection(undefined);
  }

  useEffect((): any => {
    if (cLoaded.current)
      return
    checkIsLoggedIn();
    cLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isConnected) {
      checkIfIsInRoom().then(res => {
        if (res) {
          setStep(3);
        } else {
          setStep(2);
        }
        setLoading(false);
      });
    }
  }, [isConnected]);

  useEffect(() => {
    if (connection) {
      connection.on("NewPersonalMessage", (data: MessageDto) => {
        setNewReceivedMessage(data);
      });
    }
  }, [connection]);

  useEffect(() => {
    if (newReceivedMessage) {
      handleWhenReceivingMessages(newReceivedMessage);
    }
  }, [newReceivedMessage]);

  useEffect(() => {
    if (messageRefs.current![messageQueue.length - 1]) {
      messageRefs.current![messageQueue.length - 1].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messageQueue]);

  const pushMessageRef = (el: HTMLDivElement, idx: number) => messageRefs.current[idx] = el;

  const handleWhenReceivingMessages = async (data: MessageDto) => {
    let newArr = [...messageQueue];
    let idx: number = -1;
    const newMessage: Message = {
      isMyMessage: false,
      message: data.content,
      userId: data.fromUserId || data.fromUser?.id || "",
      userName: data.fromUser!.userName || "",
      isNewMessage: true,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate
    }
    const currentMessageQueue = newArr.some((mq: MessageQueue) => mq.fromUserId === data.fromUserId || mq.fromUserId === data.fromUser?.id);
    if (!currentMessageQueue) {
      const res = await getMessage(data.fromUserId || data.fromUser?.id || "");
      if (res.isSuccess) {
        const allMessages: Message[] = res.responseData.map((m, index) => {
          const message: Message = {
            isMyMessage: m.fromUserId === user?.id,
            message: m.content,
            userId: m.toUserId || "",
            userName: m.fromUser?.userName || "",
            isNewMessage: false,
            createdDate: data.createdDate,
            updatedDate: data.updatedDate
          }
          return message;
        });
        const newMessageQueue: MessageQueue = {
          fromUser: data.fromUser!.userName,
          fromUserId: data.fromUserId || data.fromUser?.id || "",
          messages: allMessages,
          open: true
        };
        newArr.push(newMessageQueue);
      }
    } else {
      for (let index = 0; index < newArr.length; index++) {
        const currentMessageQueue = newArr[index];
        if (currentMessageQueue.fromUserId === data.fromUserId) {
          currentMessageQueue.messages.push(newMessage);
          idx = index;
          break;
        }
      }
      messageRefs.current![idx].scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setMessageQueue(newArr);
    if (idx >= 0) {
      messageRefs.current![idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messageRefs.current![0]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  }

  const handleWhenClickOnChatButton = async (data: UserDTO) => {
    let newArr = [...messageQueue];
    const currentMessageQueue = newArr.some((mq: MessageQueue) => mq.fromUserId === data.id);
    if (!currentMessageQueue) {
      const res = await getMessage(data.id);
      if (res.isSuccess) {
        if (res.responseData) {
          const messages: Message[] = res.responseData.map((m, index) => {
            const message: Message = {
              isMyMessage: m.fromUserId === user?.id,
              message: m.content,
              userId: m.toUserId || "",
              userName: m.fromUser?.userName || "",
              isNewMessage: index === res.responseData.length - 1 ? true : false,
              createdDate: m.createdDate,
              updatedDate: m.updatedDate
            }
            return message;
          });
          const newMessageQueue: MessageQueue = {
            fromUser: data.userName,
            fromUserId: data.id,
            messages: messages,
            open: true
          };
          newArr.push(newMessageQueue);
        }
      }
    } else {
      for (let index = 0; index < newArr.length; index++) {
        const currentMessageQueue = newArr[index];
        if (currentMessageQueue.fromUserId === data.id) {
          currentMessageQueue.open = true;
          break;
        }
      }
    }
    setMessageQueue(newArr);
  }

  const handleSendMessage = async (data: MessageQueue, value: string, idx: number) => {
    if (!value) return;
    const newMessageDto: MessageDto = {
      toUserId: data.fromUserId,
      content: value,
    }

    const res = await sendMessageToUser(newMessageDto);
    if (res.isSuccess) {

      let newArr = [...messageQueue];
      const newMessage: Message = {
        isMyMessage: true,
        message: value,
        userId: data.fromUserId,
        userName: data.fromUser,
        isNewMessage: true,
        createdDate: new Date(),
        updatedDate: new Date()
      };
      for (let index = 0; index < newArr.length; index++) {
        const currentMessageQueue = newArr[index];
        if (currentMessageQueue.fromUserId === data.fromUserId) {
          currentMessageQueue.messages.push(newMessage);
          break;
        }
      }
      setMessageQueue(newArr);
    } else {
      api.error({
        message: 'Send Failed',
        description: "Cannot send your message with error:" + res.errorMessage,
        duration: -1,
        placement: "top"
      })
    }
    messageRefs.current![idx].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const renderOutgoingIncomingMessage = (isMyMessage: boolean) => {
    return isMyMessage ? "outgoing-message" : "incomming-message";
  }

  const renderFocusMessage = (isNewMessage: boolean) => {
    return isNewMessage ? "new-message" : "";
  }

  const handleHideMesssge = (idx: number) => {
    setMessageQueue(prev => {
      const arr = [...prev];
      arr[idx].open = !arr[idx].open;
      return arr;
    });
  }

  const handleCloseMesssge = (idx: number) => {
    setMessageQueue(prev => {
      const arr = [...prev];
      arr.splice(idx, 1);
      return arr;
    });
  }

  return (
    <>
      <Affix offsetTop={0} style={{ marginBottom: 10 }}>
        <div className="header">
          <div className="notifications"></div>
          {
            user ? <div className='profile'>
              <Popover placement="bottomLeft" title={""} content={
                <div style={{ display: "flex", flexDirection: "column", flexWrap: "nowrap", justifyContent: "center", alignItems: "center" }}>
                  <div>Hello {user.userName}</div>
                  <div className='match-info'>
                    <div><b>Matchs:</b> <span style={{ color: "#4096ff", fontWeight: "bold" }}>{user.numberOfMatchs}</span></div>
                    <div><b>Win/Lose:</b> <span style={{ color: "#52c41a", fontWeight: "bold" }}>{user.winMatchs}</span>/<span style={{ color: "#FA541C", fontWeight: "bold" }}>{user.numberOfMatchs - user.winMatchs || 0}</span></div>
                  </div>
                  <Button type="link">Your profile</Button>
                  <Button type="dashed" onClick={logOut}>Log out</Button>
                </div>
              } trigger="click">
                <Avatar style={{ verticalAlign: 'middle', cursor: "pointer", backgroundColor: "#87d068" }} className='user-profile' size={50} gap={2}>
                  {generateShortUserName(user.userName)}
                </Avatar>
              </Popover>

            </div> : <></>
          }

        </div>

      </Affix>
      <div className='container'>
        {contextHolder}
        {
          loading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 50 }} spin />} fullscreen /> :
            <AppContext.Provider value={{
              user,
              setUser,
              redirectToLogin,
              setRedirectToLogin,
              connection,
              setConnection,
              roomInfo,
              setRoomInfo,
              matchInfo,
              setMatchInfo,
              listCoordinates,
              setListCoordinates,
              step,
              setStep,
              yourTurn,
              setYourTurn,
              start,
              setStart,
              newGame,
              setNewGame,
              watchMode,
              setWatchMode
            }}>
              {step === 1 ? <Home redirectToLogin={redirectToLogin} connectToGameHub={connectToGameHub} /> : <></>}
              {step === 2 ? <RoomList handleWhenClickOnChatButton={handleWhenClickOnChatButton} /> : <></>}
              {step === 3 ? <InGame /> : <></>}
            </AppContext.Provider>
        }

        {
          messageQueue.length ?
            <div className="message-queue">
              {
                messageQueue.map((mq, idx) => (
                  <div className="message-card">
                    <div className="title">
                      <div className='from-user'>
                        <Button
                          type="primary"
                          shape="circle"
                          size='small'
                          icon={mq.open ? <CaretDownOutlined /> : <CaretUpOutlined />}
                          onClick={() => handleHideMesssge(idx)}
                        />
                        From: {mq.fromUser}
                      </div>
                      <div className="close-message-action">
                        <Button type="link" danger shape="circle" size='small' icon={<CloseCircleOutlined />}
                          onClick={() => handleCloseMesssge(idx)}
                        />
                      </div>
                    </div>
                    <div className={mq.open ? "card-body" : "card-body close"}>
                      <div className="content">
                        <div className="messages">
                          {
                            mq.messages.map(ms => (
                              <Collapse
                                className={`${renderOutgoingIncomingMessage(ms.isMyMessage)} ${renderFocusMessage(ms.isMyMessage)}`}
                                items={[{
                                  key: ms.id,
                                  label: <span>{ms.message}</span>,
                                  children: <span>Sent at {formatUTCDateToLocalDate(ms.updatedDate!)}</span>
                                }]}
                                expandIcon={() =>
                                  <Avatar style={{ verticalAlign: 'middle', cursor: "pointer" }} size={20} gap={2}>
                                    {user?.userName}
                                  </Avatar>
                                }
                                size="small"
                                expandIconPosition={ms.isMyMessage ? "start" : "end"}
                              />
                            ))
                          }
                        </div>
                        <div ref={el => pushMessageRef(el!, idx)} />
                      </div>
                      <div className="send-action">
                        <Search
                          placeholder="Type your messages here"
                          enterButton={<SendOutlined />}
                          size="middle"

                          onSearch={(value: string) => handleSendMessage(mq, value, idx)}
                          autoFocus
                        />
                      </div>
                    </div>

                  </div>
                ))
              }

            </div>
            :
            <></>
        }

      </div >
    </>
  );
}

export default App;
