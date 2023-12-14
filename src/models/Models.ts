export interface LoginDTO {
    username: string;
    password: string;
}

export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
    rePassword: string;
}

export interface ResponseData {
    code: number;
    errorMessage: string[];
    responseData: any;
    isSuccess: Boolean;
}

export interface RoomDTO {

}

export interface UserDTO {

}