import { EnvEnpoint } from "../helpers/Helper";
import { NotificationDto, Pagination, ResponseData } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllNotifications = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<NotificationDto>>> => {
    const url = `${EnvEnpoint()}/api/Notification/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<Pagination<NotificationDto>>(url);
}

export const getUnReadNotifications = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<NotificationDto>>> => {
    const url = `${EnvEnpoint()}/api/Notification/un-read?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<Pagination<NotificationDto>>(url);
}

export const createNotification = async (data: NotificationDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Notification/create-notification`;
    return post<undefined>(url, data);
}

export const updateNotificationToRead = async (data: NotificationDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Notification/update-notification`;
    return post(url, data);
}

export const UpdateListNotificationsToRead = async (data: NotificationDto[]) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Notification/update-list-notifications`;
    return post<undefined>(url, data);
}

export const updateConversationNotificationsToSeen = async (conversationId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Notification/update-conversation-notifications/${conversationId}`;
    return post<undefined>(url);
}
