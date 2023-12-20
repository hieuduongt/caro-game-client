import axios, { AxiosError } from "axios";
import { ResponseData } from "../models/Models";
import { getAuthToken } from "../helpers/Helper";


export const post = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create({
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    });
    try {
        const res = await apiCaller.post<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<T> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData<T> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const get = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create({
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    });
    try {
        const res = await apiCaller.get<ResponseData<T>>(url, data!);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<T> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData<T> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const put = async<T> (url: string, data: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create({
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    });
    try {
        const res = await apiCaller.put<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<T> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData<T> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const deleteR = async<T> (url: string, data?: any): Promise<ResponseData<T>> => {
    const apiCaller = axios.create({
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getAuthToken()}`
        }
    });
    try {
        const res = await apiCaller.delete<ResponseData<T>>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData<T> = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData<T> = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}
