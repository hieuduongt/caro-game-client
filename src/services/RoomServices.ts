import { EnvEnpoint } from "../helpers/Helper";
import { ActionRoomDTO, Pagination, ResponseData, RoomDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllRooms = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<RoomDTO>>> => {
    const url = `${EnvEnpoint()}/api/Room/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<Pagination<RoomDTO>>(url);
}

export const getRoom = async (id: string) : Promise<ResponseData<RoomDTO>> => {
    const url = `${EnvEnpoint()}/api/Room/${id}`;
    return get<RoomDTO>(url);
}

export const getRoomByUser = async (id: string) : Promise<ResponseData<RoomDTO>> => {
    const url = `${EnvEnpoint()}/api/Room/room-by-user/${id}`;
    return get<RoomDTO>(url);
}

export const joinRoom = async (roomId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Room/${roomId}/join-room`;
    return post(url);
}

export const leaveRoom = async (roomId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Room/${roomId}/leave-room`;
    return post<undefined>(url);
}

export const sit = async (roomId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Room/${roomId}/sit`;
    return post<undefined>(url);
}

export const leaveTheSit = async (roomId: string, userId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Room/${roomId}/leave-the-sit/${userId}`;
    return post<undefined>(url);
}

export const createRoom = async (data: RoomDTO) : Promise<ResponseData<RoomDTO>> => {
    const url = `${EnvEnpoint()}/api/Room/create-room`;
    return post<RoomDTO>(url, data);
}