import { EnvEnpoint } from "../helpers/Helper";
import { GameDTO, MatchDTO, ResponseData, RoomDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const startGame = async (data: RoomDTO) : Promise<ResponseData<MatchDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/start-match`;
    return post<MatchDTO>(url, data);
}

export const endGame = async (data: RoomDTO) : Promise<ResponseData<any>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<undefined>(url, data);
}

export const move = async (data: GameDTO) : Promise<ResponseData<any>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<undefined>(url, data);
}