import { EnvEnpoint } from "../helpers/Helper";
import { LoginDTO, RegisterDTO, ResponseData, TokenDto } from "../models/Models";
import { post, get } from "./ApiCreator";

export const login = async (data: LoginDTO) : Promise<ResponseData<TokenDto>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/login`;
    return post<TokenDto>(url, data);
}

export const logout = async () : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/logout`;
    return post<undefined>(url);
}

export const authenticateUsingRefreshToken = async (data: TokenDto) : Promise<ResponseData<TokenDto>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/token/refresh`;
    return post<TokenDto>(url, data);
}

export const register = async (data: RegisterDTO) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/register`;
    return post<undefined>(url, data);
}

export const access = async () : Promise<ResponseData<string>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/access`;
    return get<string>(url);
}

export const loginAsGuest = async () : Promise<ResponseData<TokenDto>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/login-as-guest`;
    return get<TokenDto>(url);
}
