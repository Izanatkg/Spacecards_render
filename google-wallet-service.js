const axios = require('axios');
const { auth, ISSUER_ID, CLASS_ID, CLIENT_ID, loyaltyClass } = require('./google-wallet-config');

class GoogleWalletService {
    constructor() {
        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
    }

    async getAuthToken() {
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        return token.token;
    }

    async createLoyaltyObject(userId, customerInfo) {
        const objectId = `${ISSUER_ID}.user-${userId}`;
        const loyaltyObject = {
            id: objectId,
            classId: CLASS_ID,
            state: 'ACTIVE',
            accountId: customerInfo.email,
            accountName: customerInfo.name,
            barcode: {
                type: 'QR_CODE',
                value: userId
            },
            loyaltyPoints: {
                balance: {
                    string: '0'
                },
                label: 'Puntos disponibles'
            },
            messages: [
                {
                    header: '¡Bienvenido Entrenador!',
                    body: 'Obtén 10% de descuento en tu primera compra'
                }
            ],
            locations: loyaltyClass.locations
        };

        try {
            const token = await this.getAuthToken();
            
            // Primero crear el objeto en Google Wallet
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

            // Generar URL para agregar a Google Wallet
            const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
            return saveUrl;

        } catch (error) {
            if (error.response?.status === 409) {
                // El objeto ya existe, podemos continuar
                const token = await this.getAuthToken();
                return `https://pay.google.com/gp/v/save/${token}`;
            }
            console.error('Error creating loyalty object:', error.response?.data || error.message);
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
