const axios = require('axios');
const { auth, ISSUER_ID, CLASS_ID, CLIENT_ID, loyaltyClass } = require('./google-wallet-config');
const jwt = require('jsonwebtoken');
const path = require('path');

class GoogleWalletService {
    constructor() {
        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
        this.serviceAccount = require(path.join(__dirname, 'puntos-loyvers-2b7433c755f0.json'));
    }

    async getAuthToken() {
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        return token.token;
    }

    async createLoyaltyClass() {
        try {
            console.log('Creating loyalty class...');
            const token = await this.getAuthToken();
            
            // Primero intentar obtener la clase existente
            try {
                const response = await axios.get(
                    `${this.baseUrl}/loyaltyClass/${CLASS_ID}`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                console.log('Loyalty class already exists');
                return response.data;
            } catch (error) {
                if (error.response?.status !== 404) {
                    throw error;
                }
                // La clase no existe, vamos a crearla
                console.log('Loyalty class not found, creating new one...');
            }

            // Crear la clase de lealtad
            const response = await axios.post(
                `${this.baseUrl}/loyaltyClass`,
                loyaltyClass,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Loyalty class created successfully');
            return response.data;
        } catch (error) {
            console.error('Error creating loyalty class:', error.response?.data || error.message);
            throw error;
        }
    }

    async createLoyaltyObject(userId, customerInfo) {
        try {
            console.log('Creating loyalty object for user:', userId, 'with info:', customerInfo);
            const objectId = `${ISSUER_ID}.user-${userId}`;

            // Crear el objeto de lealtad
            const loyaltyObject = {
                id: objectId,
                classId: CLASS_ID,
                state: 'ACTIVE',
                accountId: customerInfo.email,
                accountName: customerInfo.name,
                barcode: {
                    type: 'QR_CODE',
                    value: customerInfo.reference_id
                },
                loyaltyPoints: {
                    balance: {
                        string: customerInfo.points.toString()
                    },
                    label: 'PokéPuntos'
                },
                messages: [
                    {
                        header: '¡Bienvenido Entrenador!',
                        body: `¡Has recibido ${customerInfo.points} PokéPuntos de regalo!`
                    }
                ]
            };

            // Obtener token de autenticación
            const token = await this.getAuthToken();

            // Crear el objeto en Google Wallet
            try {
                await axios.post(
                    `${this.baseUrl}/loyaltyObject`,
                    loyaltyObject,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } catch (error) {
                if (error.response?.status !== 409) {
                    throw error;
                }
                // Si el objeto ya existe, actualizarlo
                await axios.put(
                    `${this.baseUrl}/loyaltyObject/${objectId}`,
                    loyaltyObject,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            // Generar URL para agregar a Google Wallet
            const claims = {
                iss: this.serviceAccount.client_email,
                aud: 'google',
                origins: [],
                typ: 'savetowallet',
                payload: {
                    loyaltyObjects: [{
                        id: objectId,
                        classId: CLASS_ID
                    }]
                }
            };

            const token_jwt = jwt.sign(claims, this.serviceAccount.private_key, { algorithm: 'RS256' });
            return `https://pay.google.com/gp/v/save/${token_jwt}`;

        } catch (error) {
            console.error('Error creating loyalty object:', error.response?.data || error.message);
            throw error;
        }
    }

    async createLoyaltyPass(customerData) {
        try {
            // Primero asegurarnos de que existe la clase de lealtad
            await this.createLoyaltyClass();

            // Luego crear el objeto de lealtad
            const walletUrl = await this.createLoyaltyObject(customerData.customerId, {
                email: customerData.email || `user-${customerData.customerId}@pokepuntos.com`,
                name: customerData.name,
                reference_id: customerData.customerId,
                points: customerData.points || 0
            });

            return walletUrl;
        } catch (error) {
            console.error('Error creating loyalty pass:', error);
            throw error;
        }
    }

    async updateLoyaltyPoints(userId, newPoints) {
        const objectId = `${ISSUER_ID}.user-${userId}`;
        try {
            const token = await this.getAuthToken();
            await axios.patch(
                `${this.baseUrl}/loyaltyObject/${objectId}`,
                {
                    loyaltyPoints: {
                        balance: {
                            string: newPoints.toString()
                        }
                    }
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            return true;
        } catch (error) {
            console.error('Error updating loyalty points:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new GoogleWalletService();
