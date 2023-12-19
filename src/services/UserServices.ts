import { ResponseData, UserDTO } from "../models/Models";
import { get, post } from "./ApiCreator";

export const getUser = async (id: string) : Promise<ResponseData<UserDTO>> => {
    const url = `https://localhost:7222/api/User/${id}`;
    return get<UserDTO>(url);
}

export const getAllUsers = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<UserDTO[]>> => {
    const url = `https://localhost:7222/api/User/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<UserDTO[]>(url);
}