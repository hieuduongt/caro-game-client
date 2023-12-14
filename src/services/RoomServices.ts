import { get } from "./ApiCreator";

export const getAllRooms = async (page?: number, pageSize?: number) => {
    const url = `https://localhost:7222/api/Game/room/all?page=${page || 1}&pageSize=${pageSize || 20}`;
    return get(url);
}