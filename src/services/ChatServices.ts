import { EnvEnpoint } from "../helpers/Helper";
import { ConversationDTO, MessageDto, Pagination, ResponseData } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllMessages = async () : Promise<ResponseData<Pagination<MessageDto>>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversations`;
    return get<Pagination<MessageDto>>(url);
}

export const createConversation = async (toUserId: string) : Promise<ResponseData<ConversationDTO>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversation/${toUserId}`;
    return post<ConversationDTO>(url);
}

export const getConversation = async (toUserId: string) : Promise<ResponseData<ConversationDTO>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversation/${toUserId}`;
    return get<ConversationDTO>(url);
}

export const getAllConversations = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<ConversationDTO>>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversations?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<Pagination<ConversationDTO>>(url);
}

export const getMessage = async (conversationId: string) : Promise<ResponseData<Pagination<MessageDto>>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversation/user/messages/${conversationId}`;
    return get<Pagination<MessageDto>>(url);
}

export const getMessageOfRoom = async (roomId: string) : Promise<ResponseData<MessageDto>> => {
    const url = `${EnvEnpoint()}/api/Chat/conversation/group/messages/${roomId}`;
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