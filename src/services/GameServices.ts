import { EnvEnpoint } from "../helpers/Helper";
import { Coordinates, GameDTO, MatchDTO, ResponseData, RoomDTO } from "../models/Models";
import { post, get } from "./ApiCreator";

export const startGame = async (data: RoomDTO) : Promise<ResponseData<MatchDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/start-match`;
    return post<MatchDTO>(url, data);
}

export const finishGame = async (data: MatchDTO) : Promise<ResponseData<any>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<undefined>(url, data);
}

export const move = async (data: GameDTO) : Promise<ResponseData<any>> => {
    const url = `${EnvEnpoint()}/api/Game/move`;
    return post<undefined>(url, data);
}

export const getCurrentMatchByUserId = async (userId: string) : Promise<ResponseData<MatchDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/match/${userId}`;
    return get<MatchDTO>(url);
}

export const getGameBoard = async (matchId: string) : Promise<ResponseData<Array<Array<Coordinates>>>> => {
    const url = `${EnvEnpoint()}/api/Game/match/game-board/${matchId}`;
    return get<Array<Array<Coordinates>>>(url);
}