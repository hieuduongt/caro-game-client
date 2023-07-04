import ApiCreator from "./apiCreator";

const ChatServices = {
    sendToAll: (message) => {
        const url = `https://caro-game-server-19011997.azurewebsites.net/api/chat`;
        return ApiCreator.post(`${url}?message=${message}`);
    },
    sendToOne: (connectionId, from,  message) => {
        const url = `https://caro-game-server-19011997.azurewebsites.net/api/chat`;
        return ApiCreator.post(`${url}?connectionId=${connectionId}&from=${from}&message=${message}`);
    }
};
export default ChatServices;