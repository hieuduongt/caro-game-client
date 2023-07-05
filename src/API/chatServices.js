import ApiCreator from "./apiCreator";
import { PATH } from "../Common/path";

const ChatServices = {
    sendToAll: (message) => {
        const url = `${PATH.prod}/api/chat`;
        return ApiCreator.post(`${url}?message=${message}`);
    },
    sendToOne: (connectionId, from,  message) => {
        const url = `${PATH.prod}/api/chat`;
        return ApiCreator.post(`${url}?connectionId=${connectionId}&from=${from}&message=${message}`);
    }
};
export default ChatServices;