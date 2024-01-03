import { EnvEnpoint } from "../helpers/Helper";
import { Pagination, ResponseData, RoomDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllRooms = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<RoomDTO>>> => {
    const url = `${EnvEnpoint()}/api/Game/room/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<RoomDTO>(url);
}

export const getRoom = async (id: string) : Promise<ResponseData<RoomDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/room/${id}`;
    return get<RoomDTO>(url);
}

export const joinRoom = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/join-room`;
    return post(url, data);
}

export const leaveRoom = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/leave-room`;
    return post(url, data);
}

export const createRoom = async (data: RoomDTO) : Promise<ResponseData<RoomDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/create-room`;
    return post(url, data);
}