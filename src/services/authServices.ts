import { Login, Register } from "../models/Authentication";
import ApiCreator from "./apiCreator";

const AuthServices = {
    login: (data: Login) => {
        const url = `https://localhost:7222/api/Authenticate/login`;
        return ApiCreator.post(url, data);
    },
    register: (data: Register) => {
        const url = `https://localhost:7222/api/Authenticate/register`;
        return ApiCreator.post(url, data);
    }
};
export default AuthServices;