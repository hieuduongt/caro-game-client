import { EnvEnpoint } from "../helpers/Helper";
import { Coordinates, GameDTO, MatchDTO, ResponseData, RoomDTO } from "../models/Models";
import { post, get } from "./ApiCreator";

export const startGame = async (data: RoomDTO) : Promise<ResponseData<MatchDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/start-match`;
    return post<MatchDTO>(url, data);
}

export const finishGame = async (data: MatchDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/finish-match`;
    return post<undefined>(url, data);
}

export const move = async (data: GameDTO) : Promise<ResponseData<Coordinates>> => {
    const url = `${EnvEnpoint()}/api/Game/move`;
    return post<Coordinates>(url, data);
}

export const updateWinPoints = async (data: Coordinates[]) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Game/update-win-point`;
    return post<undefined>(url, data);
}

export const getCurrentMatchByUserId = async (userId: string) : Promise<ResponseData<MatchDTO>> => {
    const url = `${EnvEnpoint()}/api/Game/match/${userId}`;
    return get<MatchDTO>(url);
}

export const getListCoordinates = async (matchId: string) : Promise<ResponseData<Coordinates[]>> => {
    const url = `${EnvEnpoint()}/api/Game/match-coordinates/${matchId}`;
    return get<Coordinates[]>(url);
}

export const getCurrentCoordinates = async (matchId: string) : Promise<ResponseData<Coordinates>> => {
    const url = `${EnvEnpoint()}/api/Game/current-coordinates/${matchId}`;
    return get<Coordinates>(url);
}