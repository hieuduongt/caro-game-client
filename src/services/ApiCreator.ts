import axios, { AxiosError } from "axios";
import { ResponseData } from "../models/Models";
import { getAuthToken } from "../helpers/Helper";

const createHeader = (): any => {
    return {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    }
}

export const post = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
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
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const get = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
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
                responseData: undefined
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const put = async<T> (url: string, data: any): Promise<ResponseData<T>> => {
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
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const deleteR = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
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
        const result: ResponseData<any> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}
