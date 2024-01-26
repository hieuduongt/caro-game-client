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
    responseData: T;
    isSuccess: Boolean;
}

export interface Pagination<T> {
    items?: Array<T>;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
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
    isPlaying: boolean;
    connectionId: string;
}

export interface Message {
    userId: string;
    userName: string;
    message: string;
    isMyMessage: boolean;
}

export interface GameDTO {
    x: number;
    y: number;
    userId: string;
    connectionId: string;
    competitorId: string;
    competitoConnectionId: string;
}

export interface MatchDTO {
    userInMatches: UserInMatches[];
    roomId: string;
    matchId: string;
}

export interface UserInMatches {
    id: string;
    connectionId: string;
    userName?: string;
    isRoomOwner: boolean;
    timeLeft?: number;
    isWinner?: boolean;
    time: any;
}

export interface ReceiveCoordinates {
    x: number;
    y: number;
    userId: string;
}