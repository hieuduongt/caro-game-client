import { FC, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import { notification, Spin, Popover, Button, Avatar, Affix, Collapse, Input, Alert, Tooltip, Badge } from 'antd';
import { LoadingOutlined, SendOutlined, CloseCircleOutlined, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import * as signalR from "@microsoft/signalr";
import { AppContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import RoomList from './components/RoomList/RoomList';
import { EnvEnpoint, formatUTCDateToLocalDate, generateShortUserName, getAuthToken, getTokenProperties, isExpired, removeAuthToken } from './helpers/Helper';
import { getUser } from './services/UserServices';
import { Coordinates, MatchDTO, Message, MessageDto, Conversation, RoomDTO, UserDTO, ErrorMessage } from './models/Models';
import { createConversation, getConversation, getMessage, sendMessageToUser } from './services/ChatServices';
import { SystemString } from './common/StringHelper';
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newReceivedMessage, setNewReceivedMessage] = useState<MessageDto>();
  const messageRefs = useRef<Array<HTMLDivElement>>([]);
  const [errorMessages, setErrorMessages] = useState<ErrorMessage[]>([]);
  const [currentErrorMessages, setCurrentErrorMessages] = useState<ErrorMessage>();
  const [expandErrMessage, setExpandErrMessage] = useState<boolean>(false);

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
        description: SystemString.CannotConnectToServer,
        duration: -1,
        placement: "top"
      });
      addNewErrorMessage(SystemString.CannotConnectToServer);
      setLoading(false);
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
    } else {
      addNewErrorMessage(res.errorMessage);
      return false;
    }
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
    if (messageRefs.current![conversations.length - 1]) {
      messageRefs.current![conversations.length - 1].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [conversations]);

  const pushMessageRef = (el: HTMLDivElement, idx: number) => messageRefs.current[idx] = el;

  const handleWhenReceivingMessages = async (data: MessageDto) => {
    let newConversations = [...conversations];
    let idx: number = -1;
    const newMessage: Message = {
      isMyMessage: false,
      message: data.content,
      userId: data.userId || "",
      userName: "",
      isNewMessage: true,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate
    }
    const currentConversation = newConversations.some((c: Conversation) => c.id === data.conversationId);
    if (!currentConversation) {
      let newConversation: Conversation;
      const converRes = await getConversation(data.userId || "");
      if (converRes.isSuccess && converRes.responseData) {
        newConversation = converRes.responseData;
        newConversation.open = true;
        const messages = await getMessage(converRes.responseData.id);
        if (messages.isSuccess && messages.responseData.length) {
          newConversation.messages = messages.responseData.map(m => {
            const newMessage: Message = {
              id: m.id,
              message: m.content,
              isMyMessage: m.userId === user?.id,
              createdDate: m.createdDate,
              updatedDate: m.updatedDate,
              isNewMessage: false,
              userId: m.userId || "",
              userName: newConversation.users.find(u => u.id === m.userId)?.userName || ""
            }
            return newMessage;
          });
        }
        newConversations.push(newConversation);
      }
    } else {
      for (let index = 0; index < newConversations.length; index++) {
        const currentConversation = newConversations[index];
        if (currentConversation.id === data.conversationId) {
          currentConversation.messages.push(newMessage);
          idx = index;
          break;
        }
      }
    }

    setConversations(newConversations);
    if (idx >= 0) {
      messageRefs.current![idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      messageRefs.current![0]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const handleWhenClickOnChatButton = async (data: UserDTO) => {
    let newConversations = [...conversations];
    const currentConversation = newConversations.some((c: Conversation) => c.users.find(u => u.id === data.id));
    if (!currentConversation) {
      let newConversation: Conversation;
      const res = await getConversation(data.id);
      if (res.isSuccess && res.responseData) {
        newConversation = res.responseData;
        newConversation.open = true;
        const messages = await getMessage(res.responseData.id);
        if (messages.isSuccess && messages.responseData.length) {
          newConversation.messages = messages.responseData.map(m => {
            const newMessage: Message = {
              id: m.id,
              message: m.content,
              isMyMessage: m.userId === user?.id,
              createdDate: m.createdDate,
              updatedDate: m.updatedDate,
              isNewMessage: false,
              userId: m.userId || "",
              userName: newConversation.users.find(u => u.id === m.userId)?.userName || ""
            }
            return newMessage;
          });
        }
        newConversations.push(newConversation);
      } else {
        const createNewConvRes = await createConversation(data.id);
        if (createNewConvRes.isSuccess) {
          newConversations.push(createNewConvRes.responseData);
        }
      }
    } else {
      for (let index = 0; index < newConversations.length; index++) {
        const currentConversation = newConversations[index];
        if (currentConversation.fromUserId === data.id || currentConversation.toUserId === data.id) {
          currentConversation.open = true;
          break;
        }
      }
    }
    setConversations(newConversations);
  }

  const handleSendMessage = async (data: Conversation, value: string, idx: number) => {
    if (!value) return;
    const newMessageDto: MessageDto = {
      conversationId: data.id,
      content: value,
      userId: user?.id,
      toUserId: data.users.find(u => u.id !== user?.id)?.id
    }

    const res = await sendMessageToUser(newMessageDto);
    if (res.isSuccess) {

      let newArr = [...conversations];
      const newMessage: Message = {
        isMyMessage: true,
        message: value,
        userId: user?.id || "",
        userName: user?.userName || "",
        isNewMessage: true,
        createdDate: new Date(),
        updatedDate: new Date()
      };
      for (let index = 0; index < newArr.length; index++) {
        const currentMessageQueue = newArr[index];
        if (currentMessageQueue.id === data.id) {
          currentMessageQueue.messages.push(newMessage);
          break;
        }
      }
      setConversations(newArr);
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
    setConversations(prev => {
      const arr = [...prev];
      arr[idx].open = !arr[idx].open;
      return arr;
    });
  }

  const handleCloseMesssge = (idx: number) => {
    setConversations(prev => {
      const arr = [...prev];
      arr.splice(idx, 1);
      return arr;
    });
  }

  const handleCloseErrorMessage = (id: string) => {
    const filteredErrorMessages = [...errorMessages].filter(p => p.id !== id);
    setErrorMessages(filteredErrorMessages);
    setCurrentErrorMessages(filteredErrorMessages[filteredErrorMessages.length - 1]);
    if (!filteredErrorMessages.length) setExpandErrMessage(false);
  }

  const addNewErrorMessage = (content: string | string[]) => {
    if (Array.isArray(content)) {
      const messages = content.map(c => {
        const mess: ErrorMessage = {
          id: uuidv4(),
          content: c
        };
        return mess;
      });
      setErrorMessages(prev => [...prev, ...messages]);
      setCurrentErrorMessages(messages[messages.length - 1]);
    } else {
      setErrorMessages(prev => [...prev, {
        id: uuidv4(),
        content: content
      }]);
      setCurrentErrorMessages({
        id: uuidv4(),
        content: content
      });
    }
  }

  return (
    <>
      <Affix offsetTop={0} style={{ marginBottom: 10 }}>
        <div className="header">
          <div className="author">
            <div>
              <Avatar src={<img src="app-logo.PNG" style={{ width: "100%", height: "100%" }} />} style={{ verticalAlign: 'middle', boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }} size={50} />
            </div>

            <div className="link-to">
              Powered by
              <a href="https://www.hieuduongit.com/" target='_blank'> HieuduongIT.com</a>
            </div>
          </div>
          <div className="notifications">
            {currentErrorMessages ?
              <Alert
                key={currentErrorMessages.id}
                banner
                closable
                message={currentErrorMessages.content}
                type='error'
                onClose={() => handleCloseErrorMessage(currentErrorMessages.id)}
              />
              :
              <></>
            }
          </div>
          <Tooltip placement="left" title={"Click to expand"} arrow>
            <Popover
              content={
                <div className='list-errors'>
                  {
                    errorMessages.map(ms => {
                      return (
                        <Alert
                          key={ms.id}
                          banner
                          closable
                          message={ms.content}
                          type='error'
                          onClose={() => handleCloseErrorMessage(ms.id)}
                        />
                      )
                    })
                  }
                </div>

              }
              title={
                <a onClick={() => {
                  setErrorMessages([]);
                  setExpandErrMessage(false);
                  setCurrentErrorMessages(undefined);
                }}>
                  Dismiss All
                </a>
              }
              trigger="click"
              open={expandErrMessage}
              onOpenChange={(value) => {
                setExpandErrMessage(value);
              }}
            >
              <Badge count={errorMessages.length} size='default' style={{ cursor: "pointer" }} />
            </Popover>

          </Tooltip>

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

            </div>
              :
              <div className='profile'>
                <Avatar src={<img src="favicon.png" style={{ width: "100%", height: "100%" }} />} size={50} style={{ verticalAlign: 'middle' }} />
              </div>
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
              setWatchMode,
              addNewErrorMessage
            }}>
              {step === 1 ? <Home redirectToLogin={redirectToLogin} connectToGameHub={connectToGameHub} /> : <></>}
              {step === 2 ? <RoomList handleWhenClickOnChatButton={handleWhenClickOnChatButton} /> : <></>}
              {step === 3 ? <InGame /> : <></>}
            </AppContext.Provider>
        }

        {
          conversations.length ?
            <div className="message-queue">
              {
                conversations.map((c, idx) => (
                  <div className="message-card">
                    <div className="title">
                      <div className='from-user'>
                        <Button
                          type="primary"
                          shape="circle"
                          size='small'
                          icon={c.open ? <CaretDownOutlined /> : <CaretUpOutlined />}
                          onClick={() => handleHideMesssge(idx)}
                        />
                        From: {c.users.find(u => u.id !== user?.id)?.userName}
                      </div>
                      <div className="close-message-action">
                        <Button type="link" danger shape="circle" size='small' icon={<CloseCircleOutlined />}
                          onClick={() => handleCloseMesssge(idx)}
                        />
                      </div>
                    </div>
                    <div className={c.open ? "card-body" : "card-body close"}>
                      <div className="content">
                        <div className="messages">
                          {
                            c.messages.map(ms => (
                              <Collapse
                                className={`${renderOutgoingIncomingMessage(ms.isMyMessage)} ${renderFocusMessage(ms.isMyMessage)}`}
                                items={[{
                                  key: ms.id,
                                  label: <span>{ms.message}</span>,
                                  children: <span>Sent at {formatUTCDateToLocalDate(ms.updatedDate!)}</span>
                                }]}
                                expandIcon={() =>
                                  <Avatar style={{ verticalAlign: 'middle', cursor: "pointer" }} size={20} gap={2}>
                                    {c.users.find(u => u.id === ms.userId)?.userName}
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

                          onSearch={(value: string) => handleSendMessage(c, value, idx)}
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
