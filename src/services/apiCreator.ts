import axios, { AxiosError } from "axios";
import { useNavigate, useLocation } from 'react-router-dom';

const apiCaller = axios.create({
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
    }
});

interface ResponseData {
    code: number;
    errorMessage: string[];
    responseData: any;
    isSuccess: Boolean;
}

type Request = (url: string, data?: any) => Promise<ResponseData>;

export const post: Request = async (url: string, data: any) => {
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
            code: 500,
            errorMessage: [error.message],
            isSuccess: false,
            responseData: null
        }
        return result;
    }
}