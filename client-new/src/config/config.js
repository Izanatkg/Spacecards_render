const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://pokemon-loyalty-system.onrender.com'
        : 'http://localhost:3001',
    WS_URL: process.env.NODE_ENV === 'production'
        ? 'wss://pokemon-loyalty-system.onrender.com'
        : 'ws://localhost:3001'
};

export default config;
