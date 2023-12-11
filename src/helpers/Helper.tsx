import { CellValue } from "../components/GameGrid/GameGrid";

interface ReturnResult {
    winner: string;
    listCoordinates: CellValue[];
}
export const checkWinner = (gameboard: Array<Array<CellValue>>, x: number, y: number, checkingPlayer: string) : ReturnResult => {
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

const getPointValue = (gameboard: Array<Array<CellValue>>, x: number, y: number) => {
    try {
        return gameboard[x][y].player;
    } catch (error) {
        return "";
    }
}