require('dotenv').config();
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');
const { google } = require('googleapis');

class GoogleWalletService {
    constructor() {
        // Valores por defecto para el entorno de desarrollo
        this.CLASS_ID = process.env.CLASS_ID || '3388000000022884108.yugioh_loyalty_card_v2';
        this.ISSUER_ID = process.env.ISSUER_ID || '3388000000022884108';
        this.ISSUER_NAME = process.env.ISSUER_NAME || 'Mamitas Tepic';
        this.PROGRAM_NAME = process.env.PROGRAM_NAME || 'Club Duelista';
        this.PROGRAM_LOGO = process.env.PROGRAM_LOGO || 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg';

        // Cargar credenciales
        try {
            let credentials;
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
                try {
                    credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
                    console.log('Credenciales cargadas desde variable de entorno');
                } catch (parseError) {
                    console.error('Error al parsear GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
                    throw new Error('Credenciales de Google inválidas en variable de entorno');
                }
            } else {
                try {
                    const credentialsPath = path.join(__dirname, 'puntos-loyvers-2b7433c755f0.json');
                    credentials = require(credentialsPath);
                    console.log('Credenciales cargadas desde archivo:', credentialsPath);
                } catch (fileError) {
                    console.error('Error al cargar archivo de credenciales:', fileError);
                    throw new Error('No se encontró el archivo de credenciales de Google');
                }
            }

            if (!credentials || !credentials.client_email || !credentials.private_key) {
                throw new Error('Credenciales de Google incompletas o inválidas');
            }

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

            this.credentials = credentials;
            console.log('Servicio de Google Wallet inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el servicio de Google Wallet:', error);
            throw error;
        }

        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
        this.CLIENT_ID = process.env.CLIENT_ID;
        this.loyaltyClass = {
            "issuerName": process.env.ISSUER_NAME,
            "programName": "Club Duelista",
            "programLogo": {
                "sourceUri": {
                    "uri": "https://i.imgur.com/FpqHJGe.png"
                }
            },
            "rewardsTier": "REWARDS_TIER_UNSPECIFIED",
            "reviewStatus": "REVIEW_STATUS_UNSPECIFIED",
            "id": this.CLASS_ID,
            "version": "1",
            "hexBackgroundColor": "#D4AF37",
            "hexFontColor": "#FFFFFF",
            "multipleDevicesAndHoldersAllowedStatus": "STATUS_UNSPECIFIED",
            "infoModuleData": {
                "labelValueRows": [
                    {
                        "columns": [
                            {
                                "label": "Programa",
                                "value": "Club Duelista"
                            }
                        ]
                    }
                ]
            },
            "textModulesData": [
                {
                    "header": "Puntos de Duelo",
                    "body": "0"
                }
            ],
            "linksModuleData": {
                "uris": [
                    {
                        "uri": "https://pokemon-loyalty-system.onrender.com",
                        "description": "Visitar Tienda"
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
            console.log('Creating new loyalty class...');
            const token = await this.getAuthToken();
            
            // Intentar eliminar la clase existente primero
            try {
                await axios.delete(
                    `${this.baseUrl}/loyaltyClass/${this.CLASS_ID}`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                console.log('Existing loyalty class deleted successfully');
            } catch (error) {
                // Ignorar errores si la clase no existe
                console.log('No existing loyalty class to delete or error:', error.message);
            }
            
            // Crear una nueva clase
            console.log('Creating new loyalty class...');

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
                hexBackgroundColor: '#D4AF37',
                logo: {
                    sourceUri: {
                        uri: 'https://i.imgur.com/FpqHJGe.png',
                        description: 'SpaceCards Logo'
                    }
                },
                header: {
                    defaultValue: {
                        language: 'es',
                        value: 'Club Duelista'
                    }
                },
                textModulesData: [
                    {
                        header: 'Puntos de Duelo',
                        body: points ? points.toString() : '31.1'
                    }
                ],
                barcode: {
                    type: 'QR_CODE',
                    value: id,
                    alternateText: id,
                    showCodeText: { kind: 'walletobjects#value', value: email }
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
                                int: Math.floor(points)
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

    async createPass(customerId, customerName, points) {
        try {
            console.log('Iniciando creación de pase para:', {
                customerId,
                customerName,
                points,
                classId: this.CLASS_ID,
                issuerId: this.ISSUER_ID
            });

            // Verificar que tenemos todas las variables de entorno necesarias
            if (!this.CLASS_ID || !this.ISSUER_ID || !this.ISSUER_NAME || !this.PROGRAM_NAME) {
                throw new Error('Faltan variables de entorno requeridas para Google Wallet');
            }

            // Crear el objeto de lealtad
            const loyaltyObject = {
                id: `${this.ISSUER_ID}.${customerId}`,
                classId: this.CLASS_ID,
                state: "ACTIVE",
                heroImage: {
                    sourceUri: {
                        uri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
                    }
                },
                textModulesData: [
                    {
                        header: "Puntos actuales",
                        body: points.toString()
                    },
                    {
                        header: "Nivel",
                        body: "Entrenador"
                    }
                ],
                linksModuleData: {
                    uris: [
                        {
                            uri: "https://pokemon-loyalty-system.onrender.com",
                            description: "Sitio web"
                        }
                    ]
                },
                accountId: customerId,
                accountName: customerName,
                loyaltyPoints: {
                    label: "Puntos",
                    balance: {
                        string: points.toString()
                    }
                }
            };

            console.log('Objeto de lealtad creado:', loyaltyObject);

            try {
                // Intentar crear el objeto de lealtad
                const response = await this.client.loyaltyobject.insert({
                    requestBody: loyaltyObject
                });
                console.log('Objeto de lealtad creado exitosamente:', response.data);

                // Generar el link de Google Wallet
                const claims = {
                    iss: this.credentials.client_email,
                    aud: 'google',
                    origins: ['https://pokemon-loyalty-system.onrender.com'],
                    typ: 'savetowallet',
                    payload: {
                        loyaltyObjects: [{
                            id: `${this.ISSUER_ID}.${customerId}`,
                            classId: this.CLASS_ID
                        }]
                    }
                };

                console.log('Generando JWT con claims:', claims);

                const token = jwt.sign(claims, this.credentials.private_key, {
                    algorithm: 'RS256'
                });

                console.log('JWT generado exitosamente');

                return `https://pay.google.com/gp/v/save/${token}`;
            } catch (apiError) {
                console.error('Error al crear objeto de lealtad en Google Wallet:', apiError.response?.data || apiError);
                throw new Error(`Error al crear tarjeta de lealtad: ${apiError.message}`);
            }
        } catch (error) {
            console.error('Error detallado en createPass:', error);
            throw error;
        }
    }
}

module.exports = new GoogleWalletService();
