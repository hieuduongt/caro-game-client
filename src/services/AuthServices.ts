import { LoginDTO, RegisterDTO } from "../models/Models";
import { post } from "./ApiCreator";

export const login = async (data: LoginDTO) => {
    const url = `https://localhost:7222/api/Authenticate/login`;
    return post(url, data);
}

export const register = async (data: RegisterDTO) => {
    const url = `https://localhost:7222/api/Authenticate/register`;
    return post(url, data);
}
