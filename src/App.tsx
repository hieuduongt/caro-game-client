import { FC, useEffect, useRef, useState } from 'react';
import './App.css';
import { notification, Spin, Popover, Button, Avatar, Affix } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import * as signalR from "@microsoft/signalr";
import { AppContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import RoomList from './components/RoomList/RoomList';
import { EnvEnpoint, generateShortUserName, getAuthToken, getTokenProperties, isExpired, removeAuthToken } from './helpers/Helper';
import { getUser } from './services/UserServices';
import { Coordinates, MatchDTO, RoomDTO, UserDTO } from './models/Models';
import { getCurrentMatchByUserId, getListCoordinates } from './services/GameServices';

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
      if (res.responseData.isPlaying) {
        const match = await getCurrentMatchByUserId(res.responseData.id);
        if (match.isSuccess) {
          setMatchInfo(match.responseData);
          setWatchMode(true);
          const listCoordinates = await getListCoordinates(match.responseData.matchId);
          if (listCoordinates.isSuccess) {

            setListCoordinates(listCoordinates.responseData);
            const currentCoordinate = listCoordinates.responseData.find(lc => lc.current === true);
            if (currentCoordinate) {
              if (currentCoordinate.userId === currentUser?.id) {
                setYourTurn(false);
              } else {
                setYourTurn(true);
              }
            } else {
              if (currentUser?.isRoomOwner === true) {
                setYourTurn(true);
              } else {
                setYourTurn(false);
              }
            }
          } else {
            api.error({
              message: 'Connect Failed',
              description: "Cannot connect to server with error: " + listCoordinates.errorMessage,
              duration: -1,
              placement: "top"
            });
          }
        } else {
          api.error({
            message: 'Connect Failed',
            description: "Cannot connect to server with error: " + match.errorMessage,
            duration: -1,
            placement: "top"
          });
        }
      }
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

  return (
    <div className='container'>
      {contextHolder}
      {user && step === 2 ?
        <Affix offsetTop={20} style={{ marginBottom: 10, display: "flex" }}>
          <div className='profile'>
            <Popover placement="bottom" title={""} content={
              <div style={{ display: "flex", flexDirection: "column", flexWrap: "nowrap", justifyContent: "center", alignItems: "center" }}>
                <div>Hello {user.userName}</div>
                <Button type="link">Your profile</Button>
                <Button type="dashed" onClick={logOut}>Log out</Button>
              </div>
            } arrow={true} trigger="click">
              <Avatar style={{ verticalAlign: 'middle', cursor: "pointer", backgroundColor: "#87d068" }} className='user-profile' size={50} gap={2}>
                {generateShortUserName(user.userName)}
              </Avatar>
            </Popover>
            <div className='match-info'>
              <div><b>Matchs:</b> <span style={{color: "#4096ff", fontWeight: "bold"}}>{user.numberOfMatchs}</span></div>
              <div><b>Win/Lose:</b> <span style={{color: "#52c41a", fontWeight: "bold"}}>{user.winMatchs}</span>/<span style={{color: "#FA541C", fontWeight: "bold"}}>{user.numberOfMatchs - user.winMatchs || 0}</span></div>
            </div>
          </div>
        </Affix> :
        <></>
      }

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
            {step === 2 ? <RoomList /> : <></>}
            {step === 3 ? <InGame /> : <></>}
          </AppContext.Provider>
      }

    </div >


  );
}

export default App;
