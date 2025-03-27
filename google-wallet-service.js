require('dotenv').config();
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');
const { google } = require('googleapis');

class GoogleWalletService {
    constructor() {
        this.CLASS_ID = process.env.CLASS_ID || '3388000000022884108.pokemon_loyalty_card';
        this.ISSUER_ID = process.env.ISSUER_ID || '3388000000022884108';
        this.ISSUER_NAME = process.env.ISSUER_NAME || 'Pokemon Loyalty System';
        this.PROGRAM_NAME = process.env.PROGRAM_NAME || 'Pokemon Loyalty Program';

        // Cargar credenciales
        try {
            let credentials;
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
                credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            } else {
                credentials = require('./puntos-loyvers-2b7433c755f0.json');
            }
            console.log('Loaded Google credentials successfully');

            // Inicializar el cliente de autenticación
            this.auth = new GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
            });

            // Inicializar el cliente de la API de Google Wallet
            this.client = google.walletobjects({
                version: 'v1',
                auth: this.auth
            });

            console.log('Google Wallet service initialized successfully');
        } catch (error) {
            console.error('Error initializing Google Wallet service:', error);
            throw error;
        }

        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
        this.CLIENT_ID = process.env.CLIENT_ID;
        this.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
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
        console.log('Google Wallet service initialized');
    }

    async getAuthToken() {
        try {
            const client = await this.auth.getClient();
            const { token } = await client.getAccessToken();
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            throw error;
        }
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

    async createLoyaltyObject({ id, name, email, points }) {
        try {
            console.log('Creating loyalty object with:', { id, name, email, points });
            
            if (!id || !name || !email) {
                throw new Error('ID, name, and email are required');
            }

            const objectId = `${this.CLASS_ID}.${id}`;
            console.log('Generated object ID:', objectId);

            const loyaltyObject = {
                id: objectId,
                classId: this.CLASS_ID,
                state: 'ACTIVE',
                accountId: email,
                accountName: name,
                barcode: {
                    type: 'QR_CODE',
                    value: id,
                    alternateText: id
                },
                loyaltyPoints: {
                    balance: {
                        int: points || 0
                    },
                    label: 'Puntos'
                },
                textModulesData: [
                    {
                        header: 'ID de Entrenador',
                        body: id
                    },
                    {
                        header: 'Nombre',
                        body: name
                    }
                ],
                hexBackgroundColor: '#FF5733',
                logo: {
                    sourceUri: {
                        uri: 'https://i.imgur.com/FpqHJGe.png'
                    }
                },
                heroImage: {
                    sourceUri: {
                        uri: 'https://i.imgur.com/FpqHJGe.png'
                    }
                }
            };

            // Verificar si el objeto ya existe
            try {
                await this.client.loyaltyobject.get({
                    resourceId: objectId
                });
                console.log('Loyalty object already exists, updating...');
                
                // Actualizar objeto existente
                await this.client.loyaltyobject.update({
                    resourceId: objectId,
                    requestBody: loyaltyObject
                });
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log('Loyalty object does not exist, creating new one...');
                    // Crear nuevo objeto
                    await this.client.loyaltyobject.insert({
                        requestBody: loyaltyObject
                    });
                } else {
                    throw error;
                }
            }

            // Generar URL de Google Wallet
            const walletUrl = `https://pay.google.com/gp/v/save/${objectId}`;
            console.log('Generated wallet URL:', walletUrl);
            
            return walletUrl;
        } catch (error) {
            console.error('Error in createLoyaltyObject:', error);
            throw new Error('Error al crear objeto de lealtad: ' + error.message);
        }
    }

    async createLoyaltyPass(customerData) {
        try {
            // Primero asegurarnos de que existe la clase de lealtad
            await this.createLoyaltyClass();

            // Luego crear el objeto de lealtad
            const walletUrl = await this.createLoyaltyObject(customerData);

            return walletUrl;
        } catch (error) {
            console.error('Error creating loyalty pass:', error);
            throw error;
        }
    }

    async updateLoyaltyPoints(userId, points) {
        try {
            console.log('Updating points for user:', userId, 'to:', points);
            const objectId = `${this.CLASS_ID}.${userId}`;

            // Verificar si el objeto existe
            try {
                await this.client.loyaltyobject.get({
                    resourceId: objectId
                });

                // Actualizar puntos
                await this.client.loyaltyobject.patch({
                    resourceId: objectId,
                    requestBody: {
                        loyaltyPoints: {
                            balance: {
                                int: points
                            }
                        }
                    }
                });

                return true;
            } catch (error) {
                if (error.response?.status === 404) {
                    console.error('Loyalty object not found, creating new one...');
                    // Si el objeto no existe, crearlo
                    await this.createLoyaltyObject({ 
                        id: userId, 
                        name: 'Unknown', 
                        email: `user-${userId}@pokepuntos.com`, 
                        points 
                    });
                    return true;
                }
                throw error;
            }
        } catch (error) {
            console.error('Error updating loyalty points:', error);
            throw error;
        }
    }
}

module.exports = new GoogleWalletService();
