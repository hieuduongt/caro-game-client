import axios from "axios";

const apiCaller = axios.create({
    headers: {
        "Content-Type": "application/json"
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
        // handle Errors
        switch (error.response.status) {
            case 400:
                return error.response.data.errors;
            case 401:
                return window.location.href = "";
            case 403:
                return window.location.href = "";
            default:
                console.log(error);
        }

        return error.response;
    }
);

export default apiCaller;