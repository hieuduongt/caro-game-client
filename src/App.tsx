import { FC, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import { notification, Spin, Popover, Button, Avatar, Affix, Collapse, Input, Alert, Space, Badge, Drawer, List, Skeleton } from 'antd';
import { LoadingOutlined, SendOutlined, CloseCircleOutlined, CaretDownOutlined, CaretUpOutlined, AlertOutlined, MessageOutlined } from '@ant-design/icons';
import * as signalR from "@microsoft/signalr";
import { AppContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import InfiniteScroll from 'react-infinite-scroll-component';
import RoomList from './components/RoomList/RoomList';
import { EnvEnpoint, formatUTCDateToLocalDate, generateShortUserName, getAuthToken, getTokenProperties, isExpired, removeAuthToken } from './helpers/Helper';
import { getUser } from './services/UserServices';
import { Coordinates, MatchDTO, MessageDto, RoomDTO, ConversationDTO, UserDTO, NotificationDto, NotificationTypes } from './models/Models';
import { createConversation, getAllConversations, getConversation, getMessage, sendMessageToUser } from './services/ChatServices';
import { SystemString } from './common/StringHelper';
import { createNotification, updateConversationNotificationsToSeen } from './services/NotificationServices';
import ScrollToBottom from 'react-scroll-to-bottom';
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
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [newReceivedMessage, setNewReceivedMessage] = useState<MessageDto>();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [openNotificationPanel, setOpenNotificationPanel] = useState<boolean>(false);
  const [openConversationPanel, setOpenConversationPanel] = useState<boolean>(false);
  const [allConversations, setAllConversations] = useState<ConversationDTO[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [messageSending, setMessageSending] = useState<Array<boolean>>([]);
  const [openConversations, setOpenConversations] = useState<Array<boolean>>([]);
  const [conversationCurrentMessages, setConversationCurrentMessages] = useState<Array<string>>([]);

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
    hubConnection.start().then(async () => {
      setConnection(hubConnection);
      setConnected(true);
      await initAllConversations();
    }).catch((error) => {
      api.error({
        message: 'Connect Failed',
        description: SystemString.CannotConnectToServer,
        duration: -1,
        placement: "top"
      });
      const newNotification: NotificationDto = {
        id: uuidv4(),
        description: SystemString.CannotConnectToServer,
        notificationType: NotificationTypes.StandardNotification,
        seen: false,
        link: ""
      }
      addNewNotifications(newNotification, "error");
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
      const newNotification: NotificationDto = {
        id: uuidv4(),
        description: res.errorMessage.toString(),
        notificationType: NotificationTypes.StandardNotification,
        seen: false,
        link: ""
      }
      addNewNotifications(newNotification, "error");
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

      connection.on("NewNotification", (data: NotificationDto) => {
        addNewNotifications(data, 'info');
        if ((data.conversationId && data.conversationId !== "00000000-0000-0000-0000-000000000000")
          || (data.conversation?.id && data.conversation?.id !== "00000000-0000-0000-0000-000000000000")) {
          let conversationId: string;
          if (data.conversationId !== "00000000-0000-0000-0000-000000000000") {
            conversationId = data.conversationId!;
          }
          if (data.conversation?.id !== "00000000-0000-0000-0000-000000000000") {
            conversationId = data.conversation?.id!;
          }
          handleUnReadConversationWhenReceiveOpenMessage(conversationId!, true);
        }

      });
    }
  }, [connection]);

  useEffect(() => {
    if (newReceivedMessage) {
      handleWhenReceivingMessages(newReceivedMessage);
    }
  }, [newReceivedMessage]);

  const handleUnReadConversationWhenReceiveOpenMessage = (conversationId: string, unRead: boolean) => {
    setAllConversations(prev => {
      const newCons = [...prev];
      for (let index = 0; index < newCons.length; index++) {
        const con = newCons[index];
        if (con.id === conversationId) {
          con.unRead = unRead;
          break;
        }
      }
      return newCons;
    });
  }

  const initAllConversations = async () => {
    if (conversationLoading) {
      return;
    }
    setConversationLoading(true);
    const result = await getAllConversations("page", conversationPage, 20);
    if (result.isSuccess && result.responseData.items && result.responseData.items.length) {
      const newData: ConversationDTO[] = [...result.responseData.items];
      setConversationPage(prev => prev + 1);
      setConversationLoading(false);
      setAllConversations(prev => [...prev, ...newData]);
    } else {
      addNewNotifications(result.errorMessage, "error");
      setConversationLoading(false);
    }
  }

  const handleWhenReceivingMessages = async (data: MessageDto) => {
    let newConversations = [...conversations];
    const newMessage: MessageDto = {
      isMyMessage: false,
      content: data.content,
      userId: data.userId || "",
      isNewMessage: true,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate
    }
    const currentConversation = newConversations.some((c: ConversationDTO) => c.id === data.conversationId);
    if (!currentConversation) {
      let newConversation: ConversationDTO;
      const converRes = await getConversation(data.userId || "");
      if (converRes.isSuccess && converRes.responseData) {
        newConversation = converRes.responseData;
        newConversation.unRead = true;
        const messages = await getMessage(converRes.responseData.id);
        if (messages.isSuccess && messages.responseData.items && messages.responseData.items.length) {
          newConversation.messages = messages.responseData.items.map(m => {
            const newMessage: MessageDto = {
              id: m.id,
              content: m.content,
              isMyMessage: m.userId === user?.id,
              createdDate: m.createdDate,
              updatedDate: m.updatedDate,
              isNewMessage: false,
              userId: m.userId || ""
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
          currentConversation.unRead = true;
          currentConversation.messages.push(newMessage);
          break;
        }
      }
    }
    setOpenConversations(prev => {
      const arr = [...prev];
      arr[newConversations.length - 1] = true;
      return arr;
    });
    setConversations(newConversations);
  }

  const handleWhenClickOnChatButton = async (data: UserDTO) => {
    let newConversations = [...conversations];
    const currentConversation = newConversations.some((c: ConversationDTO) => c.users.find(u => u.id === data.id));
    if (!currentConversation) {
      let newConversation: ConversationDTO;
      const res = await getConversation(data.id);
      if (res.isSuccess && res.responseData) {
        const updateNotiRes = await updateConversationNotificationsToSeen(res.responseData.id);
        if (!updateNotiRes.isSuccess) {
          addNewNotifications(updateNotiRes.errorMessage, "error");
        } else {
          handleUnReadConversationWhenReceiveOpenMessage(res.responseData.id, false);
        }
        newConversation = res.responseData;
        if (!newConversation.messages) {
          newConversation.messages = [];
        }
        newConversation.open = true;
        const messages = await getMessage(res.responseData.id);
        if (messages.isSuccess && messages.responseData.items && messages.responseData.items.length) {
          newConversation.messages = messages.responseData.items.map(m => {
            const newMessage: MessageDto = {
              id: m.id,
              content: m.content,
              isMyMessage: m.userId === user?.id,
              createdDate: m.createdDate,
              updatedDate: m.updatedDate,
              isNewMessage: false,
              userId: m.userId || ""
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
      setOpenConversations(prev => {
        const arr = [...prev];
        arr[newConversations.length - 1] = true;
        return arr;
      });
    } else {
      for (let index = 0; index < newConversations.length; index++) {
        const currentConversation = newConversations[index];
        if (currentConversation.fromUserId === data.id || currentConversation.toUserId === data.id) {
          const updateNotiRes = await updateConversationNotificationsToSeen(currentConversation.id);
          if (!updateNotiRes.isSuccess) {
            addNewNotifications(updateNotiRes.errorMessage, "error");
          } else {
            handleUnReadConversationWhenReceiveOpenMessage(currentConversation.id, false);
          }
          currentConversation.unRead = false;
          setOpenConversations(prev => {
            const arr = [...prev];
            arr[index] = true;
            return arr;
          });
          break;
        }
      }
    }
    setConversations(newConversations);
  }

  const handleSendMessage = async (data: ConversationDTO, value: string, idx: number, event?: any) => {
    if (!value) return;
    setMessageSending(prev => {
      const newMS = [...prev];
      newMS[idx] = true;
      return newMS;
    });
    const newMessageDto: MessageDto = {
      conversationId: data.id,
      content: value,
      userId: user?.id,
      toUserId: data.users.find(u => u.id !== user?.id)?.id,
      isMyMessage: true
    }

    const res = await sendMessageToUser(newMessageDto);
    if (res.isSuccess) {
      const sendStatus = await sendNotificationWhenSendingMessage(data.id, newMessageDto.toUserId || "");
      if (sendStatus) {
        let newArr = [...conversations];
        const newMessage: MessageDto = {
          isMyMessage: true,
          content: value,
          userId: user?.id || "",
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
        setMessageSending(prev => {
          const newMS = [...prev];
          newMS[idx] = false;
          return newMS;
        });
      }
    } else {
      api.error({
        message: 'Send Failed',
        description: "Cannot send your message with error:" + res.errorMessage,
        duration: -1,
        placement: "top"
      })
    }
    event.target.blur();
    setConversationCurrentMessages(prev => {
      const newCCM = [...prev];
      newCCM[idx] = "";
      return newCCM;
    })
  }

  const sendNotificationWhenSendingMessage = async (conversationId: string, userId: string): Promise<boolean> => {
    const newNoti: NotificationDto = {
      userId: userId,
      conversationId: conversationId,
      description: "Your have a new message",
      notificationType: NotificationTypes.UnreadMessage,
      seen: false,
      link: ""
    }

    const res = await createNotification(newNoti);

    if (res.isSuccess) {
      return true;
    } else {
      const newNotification: NotificationDto = {
        id: uuidv4(),
        userId: userId,
        conversationId: conversationId,
        description: res.errorMessage.toString(),
        notificationType: NotificationTypes.StandardNotification,
        seen: false,
        link: ""
      }
      addNewNotifications(newNotification, "error");
    }

    return false;
  }

  const renderOutgoingIncomingMessage = (isMyMessage: boolean) => {
    return isMyMessage ? "outgoing-message" : "incomming-message";
  }

  const handleHideMesssge = (idx: number) => {
    setOpenConversations(prev => {
      const arr = [...prev];
      arr[idx] = !arr[idx];
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
    const filteredNotifications = [...notifications].filter(p => p.id !== id);
    setNotifications(filteredNotifications);
    if (!filteredNotifications.length) setOpenNotificationPanel(false);
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

  return (
    <>
      <Affix offsetTop={0} style={{ marginBottom: 10 }}>
        <div className="header">
          <div className="author">
            <div>
              <Avatar src={<img src="app-logo.PNG" style={{ width: "100%", height: "100%" }} />} style={{ verticalAlign: 'middle', boxShadow: "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }} size={40} />
            </div>

            <div className="link-to">
              Powered by
              <a href="https://www.hieuduongit.com/" target='_blank'> HieuduongIT.com</a>
            </div>
          </div>
          <div className="notifications">
            {notifications[notifications.length - 1] ?
              <Alert
                key={notifications[notifications.length - 1].id}
                banner
                onClick={() => setOpenNotificationPanel(true)}
                closable
                message={notifications[notifications.length - 1].description}
                type={notifications[notifications.length - 1].type}
                onClose={() => handleCloseErrorMessage(notifications[notifications.length - 1].id || "")}
              />
              :
              <></>
            }
          </div>

          <Badge count={notifications.length} size='small' style={{ cursor: "pointer" }} >
            <Button type="default" shape="circle" size='small' danger={!!notifications.length} icon={<AlertOutlined />} onClick={() => setOpenNotificationPanel(true)} />
          </Badge>
          {user ?
            <Badge count={allConversations.filter(c => c.unRead).length} size='small' style={{ cursor: "pointer" }} >
              <Button type="default" shape="circle" size='small' icon={<MessageOutlined />} onClick={() => setOpenConversationPanel(true)} />
            </Badge>
            :
            <></>
          }

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
                <Avatar style={{ verticalAlign: 'middle', cursor: "pointer", backgroundColor: "#87d068" }} className='user-profile' size={40} gap={2}>
                  {generateShortUserName(user.userName)}
                </Avatar>
              </Popover>

            </div>
              :
              <div className='profile'>
                <Avatar src={<img src="favicon.png" style={{ width: "100%", height: "100%" }} />} size={40} style={{ verticalAlign: 'middle' }} />
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
              addNewNotifications
            }}>
              {step === 1 ? <Home redirectToLogin={redirectToLogin} connectToGameHub={connectToGameHub} /> : <></>}
              {step === 2 ? <RoomList handleWhenClickOnChatButton={handleWhenClickOnChatButton} /> : <></>}
              {step === 3 ? <InGame /> : <></>}
              <Drawer
                title="Your Conversations"
                placement="right"
                width={350}
                onClose={() => setOpenConversationPanel(false)}
                open={openConversationPanel}
                className='conversations'
                style={{
                  borderRadius: 20
                }}
              >
                <div
                  id="scrollableDiv"
                  style={{
                    height: 400,
                    overflow: 'auto',
                    padding: '0 16px',
                    border: '1px solid rgba(140, 140, 140, 0.35)',
                  }}
                >
                  <InfiniteScroll
                    dataLength={allConversations.length}
                    next={initAllConversations}
                    hasMore={allConversations.length >= 20}
                    loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                    scrollableTarget="scrollableDiv"
                  >
                    <List
                      bordered={false}
                      dataSource={allConversations}
                      renderItem={(item) => (
                        <List.Item
                          key={item.id}
                          style={{ border: "none", padding: 12 }}
                          className={`conversation-li`}
                          onClick={() => {
                            handleWhenClickOnChatButton(item.users.find(u => u.id !== user?.id)!);
                            setOpenConversationPanel(false);
                          }}
                        >
                          <List.Item.Meta
                            avatar={<Avatar src={item.users[0].userName} />}
                            title={item.users.find(u => u.id !== user?.id)?.userName}
                            description={item.messages![0]?.content}
                            className={`conversation-item ${item.unRead ? "unread" : ""}`}
                          />
                          <div className='badge'></div>
                        </List.Item>
                      )}
                    />
                  </InfiniteScroll>
                </div>
              </Drawer>
            </AppContext.Provider>
        }

        {
          conversations.length ?
            <div className="message-queue">
              {
                conversations.map((c, idx) => (
                  <div className="message-card" onClick={c.unRead ? () => handleWhenClickOnChatButton(c.users.find(u => u.id !== user?.id)!) : () => {}}>
                    <div className={`title ${c.unRead ? 'have-message' : ""}`}>
                      <div className='from-user'>
                        <Button
                          type="default"
                          shape="circle"
                          size='small'
                          icon={openConversations[idx] ? <CaretDownOutlined /> : <CaretUpOutlined />}
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
                    <ScrollToBottom className={openConversations[idx] ? "card-body" : "card-body close"} scrollViewClassName='messages'>
                      {
                        c.messages?.map(ms => (
                          <Collapse
                            className={`${renderOutgoingIncomingMessage(ms.isMyMessage)}`}
                            items={[{
                              key: ms.id,
                              label: <span>{ms.content}</span>,
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
                    </ScrollToBottom>
                    <div className="send-action">
                      <Search
                        placeholder="Type your messages here"
                        enterButton={<SendOutlined />}
                        size="middle"
                        value={conversationCurrentMessages[idx]}
                        loading={messageSending[idx]}
                        onSearch={(value: string, event) => handleSendMessage(c, value, idx, event)}
                        onChange={(event) => setConversationCurrentMessages(prev => {
                          const newCCM = [...prev];
                          newCCM[idx] = event.target.value;
                          return newCCM;
                        })}
                      />
                    </div>
                  </div>
                ))
              }

            </div>
            :
            <></>
        }

      </div >
      <Drawer
        title="Notifications"
        placement="top"
        height={500}
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
    </>
  );
}

export default App;
