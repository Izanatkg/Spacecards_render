import axios from 'axios';

const baseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://c71c-187-191-8-220.ngrok-free.app/api';

const instance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default instance;
