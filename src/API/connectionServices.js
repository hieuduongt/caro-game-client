import ApiCreator from "./apiCreator";
import { PATH } from "../Common/path";

const ConnectionServices = {
    getAll: () => {
        const url = `${PATH.local}/api/connection`;
        return ApiCreator.get(url);
    },
    getFreeOnly: () => {
        const url = `${PATH.local}/api/connection`;
        return ApiCreator.get(`${url}/free`);
    },
    getOne: (connectionId) => {
        const url = `${PATH.local}/api/connection`;
        return ApiCreator.get(`${url}/${connectionId}`);
    },
    updateStatus: (connectionId, status) => {
        const url = `${PATH.local}/api/connection`;
        return ApiCreator.post(`${url}?connectionId=${connectionId}&status=${status}`);
    }
};
export default ConnectionServices;