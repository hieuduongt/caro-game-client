import ApiCreator from "./apiCreator";

const ChatServices = {
    sendToAll: (message) => {
        const url = `https://localhost:7170/api/chat`;
        return ApiCreator.post(`${url}?message=${message}`);
    },
    sendToOne: (connectionId, from,  message) => {
        const url = `https://localhost:7170/api/chat`;
        return ApiCreator.post(`${url}?connectionId=${connectionId}&from=${from}&message=${message}`);
    }
};
export default ChatServices;