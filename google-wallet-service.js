require('dotenv').config();
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const { JWT } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');

class GoogleWalletService {
    constructor() {
        let credentials;
        try {
            // Intenta usar las credenciales de las variables de entorno primero
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
                credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            } else {
                // Fallback para desarrollo local
                credentials = require('./puntos-loyvers-2b7433c755f0.json');
            }
        } catch (error) {
            console.error('Error loading Google credentials:', error);
            throw error;
        }

        this.auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        this.client = this.auth.getClient();
        this.httpClient = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
        this.ISSUER_ID = process.env.ISSUER_ID;
        this.CLASS_ID = process.env.CLASS_ID;
        this.CLIENT_ID = process.env.CLIENT_ID;
        this.credentials = credentials;
        this.loyaltyClass = {
            "issuerName": process.env.ISSUER_NAME,
            "programName": process.env.PROGRAM_NAME,
            "programLogo": {
                "sourceUri": {
                    "uri": process.env.PROGRAM_LOGO
                }
            },
            "rewardsTier": "REWARDS_TIER_UNSPECIFIED",
            "reviewStatus": "REVIEW_STATUS_UNSPECIFIED",
            "id": this.CLASS_ID,
            "version": "1",
            "hexBackgroundColor": process.env.HEX_BACKGROUND_COLOR,
            "hexFontColor": process.env.HEX_FONT_COLOR,
            "provider": process.env.PROVIDER,
            "infoModuleData": {
                "labelValueRows": [
                    {
                        "columns": [
                            {
                                "label": "Programa de lealtad",
                                "value": process.env.PROGRAM_NAME
                            }
                        ]
                    }
                ]
            }
        };
    }

    async getAuthToken() {
        const token = await this.client.getAccessToken();
        return token;
    }

    async createLoyaltyClass() {
        try {
            console.log('Creating loyalty class...');
            const token = await this.getAuthToken();
            
            // Primero intentar obtener la clase existente
            try {
                const response = await axios.get(
                    `${this.baseUrl}/loyaltyClass/${this.CLASS_ID}`,
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
                this.loyaltyClass,
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
            const objectId = `${this.ISSUER_ID}.user-${userId}`;

            // Crear el objeto de lealtad
            const loyaltyObject = {
                id: objectId,
                classId: this.CLASS_ID,
                state: 'ACTIVE',
                accountId: customerInfo.email,
                accountName: customerInfo.name,
                barcode: {
                    type: 'QR_CODE',
                    value: userId,
                    alternateText: userId
                },
                loyaltyPoints: {
                    balance: {
                        int: parseInt(process.env.WELCOME_POINTS || '100', 10)
                    },
                    label: 'Puntos'
                },
                textModulesData: [
                    {
                        header: 'ID de Entrenador',
                        body: userId
                    },
                    {
                        header: 'Nombre',
                        body: customerInfo.name
                    }
                ]
            };

            // Obtener token de autenticación
            const token = await this.getAuthToken();
            console.log('Got auth token');

            try {
                // Intentar obtener el objeto existente
                const existingObject = await axios.get(
                    `${this.baseUrl}/loyaltyObject/${objectId}`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                console.log('Object already exists:', existingObject.data);
                
                // Actualizar el objeto existente
                await axios.patch(
                    `${this.baseUrl}/loyaltyObject/${objectId}`,
                    loyaltyObject,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Updated existing object');
            } catch (error) {
                if (error.response?.status === 404) {
                    // Crear nuevo objeto si no existe
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
                    console.log('Created new object');
                } else {
                    throw error;
                }
            }

            // Generar URL para agregar a Google Wallet
            const claims = {
                iss: this.credentials.client_email,
                aud: 'google',
                origins: [],
                typ: 'savetowallet',
                payload: {
                    loyaltyObjects: [{
                        id: objectId,
                        classId: this.CLASS_ID
                    }]
                }
            };

            const token_jwt = jwt.sign(claims, this.credentials.private_key, { algorithm: 'RS256' });
            const walletUrl = `https://pay.google.com/gp/v/save/${token_jwt}`;
            console.log('Generated wallet URL:', walletUrl);
            return walletUrl;

        } catch (error) {
            console.error('Error in createLoyaltyObject:', error.response?.data || error);
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
        const objectId = `${this.ISSUER_ID}.user-${userId}`;
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
