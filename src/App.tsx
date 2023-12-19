import { FC, useEffect, useRef, useState } from 'react';
import './App.css';
import { notification } from 'antd';
import * as signalR from "@microsoft/signalr";
import { PlayerContext, StepContext, UserContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import RoomList from './components/RoomList/RoomList';
import { getAuthToken, getTokenProperties, isExpired, removeAuthToken } from './helpers/Helper';
import { getUser } from './services/UserServices';
import { RoomDTO, UserDTO } from './models/Models';
import { getRoom } from './services/RoomServices';

const App: FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const [player, setPlayer] = useState<string>("playerX");
  const connected = useRef<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [step, setStep] = useState<number>(1);
  const [user, setUser] = useState<UserDTO>();
  const [redirectToLogin, setRedirectToLogin] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<RoomDTO>();

  const checkIsLoggedIn = (): void => {
    const token = getAuthToken();
    if (token) {
      const isExp = isExpired();
      if (isExp) {
        removeAuthToken();
        setRedirectToLogin(true);
        setStep(1);
      } else {
        const hubConnection = new signalR.HubConnectionBuilder()
          .withUrl("https://localhost:7222/connection/hub/game", {
            accessTokenFactory: () => getAuthToken(),
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            withCredentials: true,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Information)
          .build();

        hubConnection.start().then(async () => {
          setConnection(hubConnection);
          connected.current = true;
          const isInRoom = await checkIfIsInRoom();
          if (isInRoom) {
            setStep(3);
          } else {
            setStep(2);
          }
        }).catch((error) => {
          api.error({
            message: 'Login Failed',
            description: error,
            duration: -1,
            placement: "top"
          });
        });
      }
    } else {
      setStep(1);
    }
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
        lastActiveDate: res.responseData.lastActiveDate
      }
      setUser(currentUser);
      return res.responseData.roomId;
    }
    return false;
  }

  useEffect((): any => {
    if (connected.current)
      return
    checkIsLoggedIn();
  }, []);

  useEffect(() => {
    if (connection) {
      connection.on("UserLeaved", (mess) => {
        console.log(mess);
      });
      connection.on("SetOwner", (data) => {
        console.log(data);
      });
      connection.on("WelComeMessage", (mess) => {
        console.log(mess);
      });
      connection.on("UserLoggedIn", (data) => {
        console.log(data);
      });
      connection.on("UserLoggedOut", (data) => {
        console.log(data);
      });
    }
  }, [connection])

  return (
    <div className='container'>
      {contextHolder}
      <UserContext.Provider value={{ user, setUser, redirectToLogin, setRedirectToLogin, connection, roomInfo, setRoomInfo }}>
        <PlayerContext.Provider value={[player, setPlayer]}>
          <StepContext.Provider value={[step, setStep]}>
            {step === 1 ? <Home redirectToLogin={redirectToLogin} /> : <></>}
            {step === 2 ? <RoomList /> : <></>}
            {step === 3 ? <InGame /> : <></>}
          </StepContext.Provider>

        </PlayerContext.Provider>
      </UserContext.Provider>
    </div>


  );
}

export default App;
