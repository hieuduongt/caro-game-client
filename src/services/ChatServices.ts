import { EnvEnpoint } from "../helpers/Helper";
import { MessageDto, Pagination, ResponseData } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllMessages = async () : Promise<ResponseData<Pagination<MessageDto>>> => {
    const url = `${EnvEnpoint()}/api/Chat/messages`;
    return get<Pagination<MessageDto>>(url);
}

export const getMessage = async (toUserId: string) : Promise<ResponseData<MessageDto[]>> => {
    const url = `${EnvEnpoint()}/api/Chat/message/${toUserId}`;
    return get<MessageDto[]>(url);
}

export const getMessageOfRoom = async (roomId: string) : Promise<ResponseData<MessageDto>> => {
    const url = `${EnvEnpoint()}/api/Chat/messages/${roomId}`;
    return get<MessageDto>(url);
}

export const sendMessageToUser = async (data: MessageDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Chat/send`;
    return post<undefined>(url, data);
}

export const sendMessageToGroup = async (data: MessageDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Chat/send-to-group`;
    return post<undefined>(url);
}