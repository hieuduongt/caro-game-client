import { EnvEnpoint } from "../helpers/Helper";
import { BanReasonDto, BanRequestDto, LoginDTO, RegisterDTO, ResponseData, SetRolesRequestDto, TokenDto } from "../models/Models";
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

export const getRoles = async () : Promise<ResponseData<string[]>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/roles`;
    return get<string[]>(url);
}

export const setRoles = async (data: SetRolesRequestDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/set-role`;
    return post<undefined>(url, data);
}

export const getBanReasons = async () : Promise<ResponseData<BanReasonDto[]>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/ban-reasons`;
    return get<BanReasonDto[]>(url);
}

export const banUser = async (data: BanRequestDto) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/ban`;
    return post<undefined>(url, data);
}

export const unBanUser = async (userId: string) : Promise<ResponseData<undefined>> => {
    const url = `${EnvEnpoint()}/api/Authenticate/unban/${userId}`;
    return post<undefined>(url);
}
