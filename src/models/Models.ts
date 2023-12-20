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

export interface ResponseData<T> {
    code: number;
    errorMessage: string[];
    responseData: T | any;
    isSuccess: Boolean;
}

export enum Status {
    Available,
    Unavailable
}

export enum AccountStatus {
    Active,
    Inactive,
    Banned
}

export interface RoomDTO {
    id: string;
    name: string;
    roomOwnerId?: string
    guestId?: string;
    status?: Status;
    numberOfUsers?: number;
    members?: UserDTO[];
}

export interface UserDTO {
    id: string;
    roomId: string;
    isRoomOwner: boolean;
    sitting: boolean;
    userName: string;
    email: string;
    role: string[];
    status: AccountStatus;
    createdDate: Date;
    lastActiveDate: Date;
    isEditBy: string;
    isOnline: boolean;
}

export interface Message {
    userId: string;
    userName: string;
    message: string;
    isMyMessage: boolean;

}