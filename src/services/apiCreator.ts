import axios from "axios";
import { useNavigate, useLocation } from 'react-router-dom';

const apiCaller = axios.create({
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("authToken")}`
    }
});

apiCaller.interceptors.response.use(
    (response) => {
        return response;
        
    },
    (error) => {
        if (!error.response) {
            console.log("%cSystem: " + error.message + "!", "color:red; font-size:30px;");
            return;
        }
        const navigate = useNavigate();
        const location = useLocation();
        // handle Errors
        switch (error.response.status) {
            case 400:
                return error.response.data.errors;
            case 401:
                return navigate(`/login?redirectUri=${location.pathname}`);
            case 403:
                return navigate(`/login?redirectUri=${location.pathname}`);
            default:
                console.log(error);
        }

        return error.response;
    }
);

export default apiCaller;