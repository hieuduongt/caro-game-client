import React, { FC, useEffect, useRef, useState } from 'react';
import './App.css';
import * as signalR from "@microsoft/signalr";
import { PlayerContext } from './helpers/Context';
import InGame from './components/Ingame/Ingame';
import Home from './components/Home/Home';
import RoomList from './components/RoomList/RoomList';

const App : FC = () => {
  const [player, setPlayer] = useState<string>("playerX");
  const connected = useRef<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection>();
  const [step, setStep] = useState<number>(1);

  useEffect((): any => {
    if (connected.current)
      return
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7222/game")
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    hubConnection.start().then(a => {
      if (hubConnection.connectionId) {
        hubConnection.on("UserLeaved", (mess) => {
          console.log(mess);
        });
        hubConnection.on("SetOwner", (data) => {
          console.log(data);
        });
        hubConnection.on("WelComeMessage", (mess) => {
          console.log(mess);
        });
      }
    });

    setConnection(hubConnection);
    connected.current = true;
  }, []);

  return (
    <PlayerContext.Provider value={[player, setPlayer]}>
      {step === 1 ? <Home/> : <></>}
      {step === 2 ?<RoomList/> : <></>}
      {step === 3 ? <InGame/> : <></>}
    </PlayerContext.Provider>
  );
}

export default App;
