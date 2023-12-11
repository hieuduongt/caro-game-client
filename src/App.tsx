import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import GameGrid from './components/GameGrid/GameGrid';
import * as signalR from "@microsoft/signalr";
import { PlayerContext } from './helpers/Context';

function App() {
  const [player, setPlayer] = useState<string>("playerX");
  const connected = useRef<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection>();

  useEffect((): any => {
    if (connected.current)
      return
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://caro-game-server-19011997.azurewebsites.net/api/game")
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    hubConnection.start().then(a => {
      if (hubConnection.connectionId) {
        hubConnection.on("RejectedPlay", (connId, mess) => {
          hubConnection.send('RejectPlay', {});
        });
      }
    });

    setConnection(hubConnection);
    connected.current = true;
  }, []);

  return (
    <PlayerContext.Provider value={[player, setPlayer]}>
      <GameGrid currentPlayer={player} foundWinner={(winner, reset) => { console.log(winner); }} lengthX={40} lengthY={20} onclick={() => { }} />
    </PlayerContext.Provider>
  );
}

export default App;
