import axios from "axios"

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
    throw new Error(
        "Missing VITE_API_BASE_URL. Copy .env.example to .env and set your backend URL."
    );
}

const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;

