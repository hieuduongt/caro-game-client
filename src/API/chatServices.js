import ApiCreator from "./apiCreator";
import { PATH } from "../Common/path";

const ChatServices = {
    sendToAll: (message) => {
        const url = `${PATH.local}/api/chat`;
        return ApiCreator.post(`${url}?message=${message}`);
    },
    sendToOne: (connectionId, from,  message) => {
        const url = `${PATH.local}/api/chat`;
        return ApiCreator.post(`${url}?connectionId=${connectionId}&from=${from}&message=${message}`);
    }
};
export default ChatServices;