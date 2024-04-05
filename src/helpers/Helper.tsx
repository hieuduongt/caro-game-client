import { jwtDecode } from "jwt-decode";
import { Coordinates } from "../models/Models";

interface ReturnResult {
    winner: string;
    listCoordinates: Coordinates[];
}

interface DecodedToken {
    exp?: string | number | string[];
    role?: string | number | string[];
    name?: string | number | string[];
    nameidentifier?: string | number | string[];
}

const EnvEnpoint = (): string => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return "https://localhost:7222";
    } else {
        return "https://caro-server.hieuduongit.com";
    }
}

const formatUTCDateToLocalDate = (date: Date): string => {
    let localDate;
    if (isIsoDate(date.toString())) {
        localDate = new Date(date.toString() + "Z");
    } else {
        localDate = new Date(date.toString());
    }
    return `${localDate.getHours()}:${localDate.getMinutes()}:${localDate.getSeconds()} ${localDate.getDate()}/${localDate.getUTCMonth() + 1}/${localDate.getFullYear()}`
}

const isIsoDate = (str: string) => {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3,10}$/.test(str)) return true;
    return false;
}

const generateShortUserName = (userName: string): string => {
    const seperatedWords = userName.split(" ");
    let returnName = "";
    if (seperatedWords.length > 1) {
        const firstLetter = seperatedWords[0][0];
        const lastLetter = seperatedWords[seperatedWords.length - 1][0];
        returnName = firstLetter.toLowerCase() + lastLetter.toUpperCase();
    } else {
        returnName = seperatedWords[0][0].toUpperCase();
    }
    return returnName;
}

const checkWinner = (gameboard: Array<Array<Coordinates>>, x: number, y: number, checkingPlayer: string): ReturnResult => {
    const result: ReturnResult = {
        winner: "",
        listCoordinates: []
    };
    let count = 0;
    for (let index = x - 4; index <= x + 4; index++) {
        const currentPlayer = getPointValue(gameboard, index, y);
        if (currentPlayer === checkingPlayer) {
            result.listCoordinates.push(gameboard[index][y]);
            count++;
            if (count === 5) {
                result.winner = checkingPlayer;
                return result;
            }
        } else {
            result.listCoordinates = [];
            count = 0;
        }
    }

    count = 0;
    for (let index = y - 4; index <= y + 4; index++) {
        const currentPlayer = getPointValue(gameboard, x, index);
        if (currentPlayer === checkingPlayer) {
            result.listCoordinates.push(gameboard[x][index]);
            count++;
            if (count === 5) {
                result.winner = checkingPlayer;
                return result;
            }
        } else {
            result.listCoordinates = [];
            count = 0;
        }
    }

    let checkPointXBL = x + 4;
    let checkPointYBL = y - 4;
    const stopPointXTR = x - 4;
    const stopPointYTR = y + 4;

    let checkPointXTL = x - 4;
    let checkPointYTL = y - 4;
    const stopPointXBR = x + 4;
    const stopPointYBR = y + 4;

    count = 0;
    while (checkPointYBL <= stopPointYTR && checkPointXBL >= stopPointXTR) {
        const currentPlayer = getPointValue(gameboard, checkPointXBL, checkPointYBL);
        if (currentPlayer === checkingPlayer) {
            result.listCoordinates.push(gameboard[checkPointXBL][checkPointYBL]);
            count++;
            if (count === 5) {
                result.winner = checkingPlayer;
                return result;
            }
        } else {
            result.listCoordinates = [];
            count = 0;
        }
        checkPointYBL++;
        checkPointXBL--;
    }
    count = 0;
    while (checkPointYTL <= stopPointYBR && checkPointXTL <= stopPointXBR) {
        const currentPlayer = getPointValue(gameboard, checkPointXTL, checkPointYTL);
        if (currentPlayer === checkingPlayer) {
            result.listCoordinates.push(gameboard[checkPointXTL][checkPointYTL]);
            count++;
            if (count === 5) {
                result.winner = checkingPlayer;
                return result;
            }
        } else {
            result.listCoordinates = [];
            count = 0;
        }
        checkPointXTL++;
        checkPointYTL++;
    }

    return result;
}

const getPointValue = (gameboard: Array<Array<Coordinates>>, x: number, y: number): string => {
    try {
        return gameboard[x][y].userId;
    } catch (error) {
        return "";
    }
}

const getAuthToken = (): string => {
    const tokenString = localStorage.getItem('authToken');
    return tokenString || "";
};

const setAuthToken = (authToken: string): void => {
    localStorage.setItem('authToken', authToken);
};

const removeAuthToken = (): void => {
    localStorage.removeItem('authToken');
};

const getTokenProperties = (name?: "exp" | "role" | "nameidentifier" | "name"): any => {
    const token = getAuthToken();

    if (token) {
        const result: DecodedToken = {
            exp: undefined,
            name: "",
            nameidentifier: "",
            role: ""
        };
        const decoded = jwtDecode(token);
        type TokenKey = keyof typeof result;
        type ObjectKey = keyof typeof decoded;
        const objKeys = Object.keys(decoded);
        for (const it of objKeys) {
            if (/^exp$/g.test(it)) result.exp = decoded[it as ObjectKey];
            if (/\/role$/g.test(it)) result.role = decoded[it as ObjectKey];
            if (/\/nameidentifier$/g.test(it)) result.nameidentifier = decoded[it as ObjectKey];
            if (/\/name$/g.test(it)) result.name = decoded[it as ObjectKey];
        }
        if (name) {
            return result[name as TokenKey];
        } else {
            return result;
        }
    }
    return "";
}

const compareRole = (roles: string, currentRole: string): boolean => {
    let valid = false;
    if (Array.isArray(roles) && typeof currentRole === 'string') {
        roles.forEach(role => {
            if (role === currentRole) valid = true;
        })
    } else if (typeof roles === 'string' && typeof currentRole === 'string') {
        if (roles === currentRole) valid = true;
    } else {
        throw new Error("Your data is not valid")
    }
    return valid;
}

const isExpired = (): boolean => {
    const token = getAuthToken();
    if (token) {
        var decoded = jwtDecode(token);
        const expireDate = decoded["exp"];
        const date = new Date(expireDate ? (expireDate * 1000) : "");
        const today = new Date();
        return date < today;
    }
    return false;
}

export { setAuthToken, getAuthToken, getTokenProperties, compareRole, removeAuthToken, isExpired, checkWinner, EnvEnpoint, generateShortUserName, formatUTCDateToLocalDate }