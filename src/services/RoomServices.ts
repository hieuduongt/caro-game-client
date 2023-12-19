import { ResponseData, RoomDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getAllRooms = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<RoomDTO>> => {
    const url = `https://localhost:7222/api/Game/room/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<RoomDTO>(url);
}

export const getRoom = async (id: string) : Promise<ResponseData<RoomDTO>> => {
    const url = `https://localhost:7222/api/Game/room/${id}`;
    return get(url);
}

export const joinRoom = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `https://localhost:7222/api/Game/join-room`;
    return post(url, data);
}

export const leaveRoom = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `https://localhost:7222/api/Game/leave-room`;
    return post(url, data);
}

export const createRoom = async (data: RoomDTO) : Promise<ResponseData<RoomDTO>> => {
    const url = `https://localhost:7222/api/Game/create-room`;
    return post(url, data);
}