import axios, { AxiosError } from "axios";
import { ResponseData, TokenDto } from "../models/Models";
import { EnvEnpoint, getAuthToken, getRefreshToken, removeAuthToken, removeRefreshToken, setAuthToken, setRefreshToken } from "../helpers/Helper";

const createHeader = (): any => {
    return {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    }
}

const reAuthenWithRefreshToken = async (): Promise<boolean> => {
    const token: TokenDto = {
        accessToken: getAuthToken(),
        refreshToken: getRefreshToken()
    }
    try {
        const res = await axios.post<ResponseData<TokenDto>>(`${EnvEnpoint()}/api/Authenticate/login-refresh-token`, token);
        if (res.status === 200 && res.data.isSuccess && res.data.responseData) {
            setAuthToken(res.data.responseData.accessToken);
            setRefreshToken(res.data.responseData.refreshToken);
            return true;
        } else {
            removeAuthToken();
            removeRefreshToken();
            return false;
        }
    } catch (ex: any) {
        return false;
    }
}

export const post = async<T>(url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create(createHeader());
    try {
        const res = await apiCaller.post<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<any> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        if(error.response?.status === 401) {
            const reAuthenRes = await reAuthenWithRefreshToken();
            if(reAuthenRes) {
                return await post<T>(url, data);
            }
        }
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const get = async<T>(url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create(createHeader());
    try {
        const res = await apiCaller.get<ResponseData<T>>(url, data!);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<any> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        if(error.response?.status === 401) {
            const reAuthenRes = await reAuthenWithRefreshToken();
            if(reAuthenRes) {
                return await get<T>(url, data);
            }
        }
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const put = async<T>(url: string, data: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create(createHeader());
    try {
        const res = await apiCaller.put<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<any> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        if(error.response?.status === 401) {
            const reAuthenRes = await reAuthenWithRefreshToken();
            if(reAuthenRes) {
                return await put<T>(url, data);
            }
        }
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const deleteR = async<T>(url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create(createHeader());
    try {
        const res = await apiCaller.delete<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<any> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        if(error.response?.status === 401) {
            const reAuthenRes = await reAuthenWithRefreshToken();
            if(reAuthenRes) {
                return await deleteR<T>(url, data);
            }
        }
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}
