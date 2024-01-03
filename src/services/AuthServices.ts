import { EnvEnpoint } from "../helpers/Helper";
import { LoginDTO, RegisterDTO } from "../models/Models";
import { post } from "./ApiCreator";

export const login = async (data: LoginDTO) => {
    const url = `${EnvEnpoint()}/api/Authenticate/login`;
    return post(url, data);
}

export const register = async (data: RegisterDTO) => {
    const url = `${EnvEnpoint()}/api/Authenticate/register`;
    return post(url, data);
}
