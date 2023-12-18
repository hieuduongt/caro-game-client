import { ResponseData, UserDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const isInRoom = async (id: string) : Promise<ResponseData<boolean>> => {
    const url = `https://localhost:7222/api/Game/is-in-room/id=${id}`;
    return get<boolean>(url);
}