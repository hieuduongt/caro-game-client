import ApiCreator from "./apiCreator";

const ConnectionServices = {
    getAll: () => {
        const url = `https://localhost:7170/api/connection`;
        return ApiCreator.get(url);
    },
    getFreeOnly: () => {
        const url = `https://localhost:7170/api/connection`;
        return ApiCreator.get(`${url}/free`);
    },
    getOne: (connectionId) => {
        const url = `https://localhost:7170/api/connection`;
        return ApiCreator.get(`${url}/${connectionId}`);
    }
};
export default ConnectionServices;