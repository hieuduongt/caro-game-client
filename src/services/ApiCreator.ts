import axios, { AxiosError } from "axios";
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponseData } from "../models/Models";

const apiCaller = axios.create({
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
    }
});

type Request = (url: string, data?: any) => Promise<ResponseData>;

export const post: Request = async (url: string, data: any) => {
    try {
        const res = await apiCaller.post<ResponseData>(url, data);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}

export const get: Request = async (url: string, data: any) => {
    try {
        const res = await apiCaller.get<ResponseData>(url, data!);
        if (res.status === 200) {
            return res.data;
        } else {
            const result: ResponseData = {
                code: res.status,
                errorMessage: ["Cannot send your request"],
                isSuccess: false,
                responseData: null
            }
            return result;
        }
    } catch (ex: any) {
        const error = ex as AxiosError;
        const result: ResponseData = {
            code: error.response?.status || 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}
