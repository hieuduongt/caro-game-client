import { EnvEnpoint } from "../helpers/Helper";
import { Pagination, ResponseData, UserDTO } from "../models/Models";
import { get } from "./ApiCreator";

export const getUser = async (id: string) : Promise<ResponseData<UserDTO>> => {
    const url = `${EnvEnpoint()}/api/User/${id}`;
    return get<UserDTO>(url);
}

export const getAllUsers = async (search?: string, page?: number, pageSize?: number) : Promise<ResponseData<Pagination<UserDTO>>> => {
    const url = `${EnvEnpoint()}/api/User/all?search=${search}&page=${page || 1}&pageSize=${pageSize || 20}`;
    return get<Pagination<UserDTO>>(url);
}