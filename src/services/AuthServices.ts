import { EnvEnpoint } from "../helpers/Helper";
import { LoginDTO, RegisterDTO, ResponseData } from "../models/Models";
import { post } from "./ApiCreator";

export const login = async (data: LoginDTO) : Promise<ResponseData<string>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/login`;
    return post<string>(url, data);
}

export const register = async (data: RegisterDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/register`;
    return post<undefined>(url, data);
}
