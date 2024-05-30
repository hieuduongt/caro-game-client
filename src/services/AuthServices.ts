import { EnvEnpoint } from "../helpers/Helper";
import { LoginDTO, RegisterDTO, ResponseData, TokenDto } from "../models/Models";
import { post } from "./ApiCreator";

export const login = async (data: LoginDTO) : Promise<ResponseData<TokenDto>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/login`;
    return post<TokenDto>(url, data);
}

export const authenticateUsingRefreshToken = async (data: TokenDto) : Promise<ResponseData<TokenDto>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/login-refresh-token`;
    return post<TokenDto>(url, data);
}

export const register = async (data: RegisterDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/register`;
    return post<undefined>(url, data);
}
