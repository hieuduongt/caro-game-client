import ApiCreator from "./apiCreator";

const ConnectionServices = {
    getAll: () => {
        const url = `https://caro-game-server-19011997.azurewebsites.net/api/connection`;
        return ApiCreator.get(url);
    },
    getFreeOnly: () => {
        const url = `https://caro-game-server-19011997.azurewebsites.net/api/connection`;
        return ApiCreator.get(`${url}/free`);
    },
    getOne: (connectionId) => {
        const url = `https://caro-game-server-19011997.azurewebsites.net/api/connection`;
        return ApiCreator.get(`${url}/${connectionId}`);
    }
};
export default ConnectionServices;