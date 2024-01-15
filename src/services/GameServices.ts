import { EnvEnpoint } from "../helpers/Helper";
import { GameDTO, ResponseData, RoomDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const startGame = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/start-match`;
    return post<ResponseData<undefined>>(url, data);
}

export const endGame = async (data: RoomDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<ResponseData<undefined>>(url, data);
}

export const move = async (data: GameDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<ResponseData<undefined>>(url, data);
}