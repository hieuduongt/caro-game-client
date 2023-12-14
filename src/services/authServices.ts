import { Login, Register } from "../models/Authentication";
import { post, get } from "./apiCreator";

export const login = async (data: Login) => {
    const url = `https://localhost:7222/api/Authenticate/login`;
    return post(url, data); 
}

export const register = async (data: Register) => {
    const url = `https://localhost:7222/api/Authenticate/register`;
    return post(url, data);
}

export const getAllUsers = async (page?: number, pageSize?: number) => {
    const url = `https://localhost:7222/api/Game/room/all?page=${page || 1}&pageSize=${pageSize || 20}`;
    return get(url);
}