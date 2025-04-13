require('dotenv').config();
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const path = require('path');
const { google } = require('googleapis');

class GoogleWalletService {
    constructor() {
        // Valores por defecto para el entorno de desarrollo
        this.CLASS_ID = process.env.CLASS_ID || '3388000000022884108.pokemon_loyalty_card';
        this.ISSUER_ID = process.env.ISSUER_ID || '3388000000022884108';
        this.ISSUER_NAME = process.env.ISSUER_NAME || 'Space Pass';
        this.PROGRAM_NAME = process.env.PROGRAM_NAME || 'Space Pass';


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
            // Intentar crear la clase de lealtad si no existe
            this.createOrUpdateLoyaltyClass().then(() => {
                console.log('Clase de lealtad creada/actualizada correctamente');
            }).catch(error => {
                console.error('Error al crear/actualizar clase de lealtad:', error);
            });

            console.log('Servicio de Google Wallet inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el servicio de Google Wallet:', error);
            throw error;
        }

        this.baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';
        this.CLIENT_ID = process.env.CLIENT_ID;
        this.loyaltyClass = {
            "id": this.CLASS_ID,
            "issuerName": "Space Pass",
            "programName": "Space Pass",
            "programLogo": {},
            "reviewStatus": "REVIEW_STATUS_UNSPECIFIED",
            "version": "1",
            "hexBackgroundColor": "#FFD700",
            "hexFontColor": "#000000",
            "multipleDevicesAndHoldersAllowedStatus": "STATUS_UNSPECIFIED",
            "messages": [
                {
                    "header": "Bienvenido a Space Pass",
                    "body": "Escanea este código para acumular puntos"
                }
            ],
            "locations": [],
            "accountIdLabel": "ID de Cliente",
            "accountNameLabel": "Nombre",
            "rewardsTier": "REWARDS_TIER_UNSPECIFIED",
            "secondaryLoyaltyPoints": [],
            "textModulesData": [
                {
                    "header": "Space Points",
                    "body": "0"
                }
            ],
            "linksModuleData": {
                "uris": [
                    {
                        "uri": "https://space-pass-nq9e0cv.gamma.site",
                        "description": "Visitar Space Pass",
                        "id": "website"
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
            
            // Forzar eliminación de la clase existente
            try {
                const deleteUrl = `${this.baseUrl}/loyaltyClass/${this.CLASS_ID}`;
                console.log('Attempting to delete existing class:', deleteUrl);
                await axios.delete(deleteUrl, {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Successfully deleted existing loyalty class');
            } catch (deleteError) {
                console.log('No existing class to delete or error:', deleteError.message);
            }
            
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
                accountId: id,
                accountName: name,
                issuerName: this.ISSUER_NAME,
                loyaltyPoints: {
                    balance: {
                        string: points.toString()
                    },
                    label: 'Space Points'
                },
                barcode: {
                    type: 'QR_CODE',
                    value: id,
                    alternateText: id,
                    showCodeText: { type: 'TEXT' },
                    alignment: 'CENTER',
                    renderEncoded: true,
                    valueDisplayed: true
                },
                cardTitle: {
                    defaultValue: {
                        language: 'es',
                        value: 'Space Pass'
                    }
                },
                hexBackgroundColor: '#1a1f2e',
                hexFontColor: '#ffd700',
                textModulesData: [
                    {
                        header: 'Space Points',
                        body: points.toString()
                    }
                ],
                infoModuleData: {
                    labelValueRows: [
                        {
                            columns: [
                                {
                                    label: 'Monedero Electrónico Space Pass',
                                    value: 'Acumula y Disfruta'
                                }
                            ]
                        }
                    ]
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
                                string: points.toString()
                            },
                            label: 'Space Points'
                        },
                        textModulesData: [
                            {
                                header: 'Space Points',
                                body: points.toString()
                            }
                        ]
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
                barcode: {
                    type: "QR_CODE",
                    value: customerId,
                    alternateText: customerId,
                    renderEncoded: true
                },
                hexBackgroundColor: "#FFD700",
                hexFontColor: "#000000",
                issuerName: this.ISSUER_NAME,
                accountId: customerId,
                accountName: customerName,
                points: {
                    balance: {
                        int: points
                    },
                    label: "Space Points"
                },
                textModulesData: [
                    {
                        header: "Space Points",
                        body: points.toString()
                    }
                ],
                linksModuleData: {
                    uris: [
                        {
                            uri: "https://space-pass-nq9e0cv.gamma.site",
                            description: "Visitar Space Pass",
                            id: "website"
                        }
                    ]
                },
                infoModuleData: {
                    labelValueRows: [
                        {
                            columns: [
                                {
                                    label: "Monedero Electrónico Space Pass",
                                    value: "Acumula y Disfruta"
                                }
                            ]
                        }
                    ]
                },
                accountId: customerId,
                accountName: customerName,
                loyaltyPoints: {
                    label: "Space Points",
                    balance: {
                        string: points.toString()
                    }
                },
                localizedAccountName: {
                    kind: "walletobjects#localizedString",
                    defaultValue: {
                        language: "es",
                        value: customerName
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
                    origins: ['https://spacecards-loyalty.onrender.com'],
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
    async createOrUpdateLoyaltyClass() {
        try {
            console.log('Iniciando createOrUpdateLoyaltyClass con CLASS_ID:', this.CLASS_ID);

            const loyaltyClass = {
                'id': this.CLASS_ID,
                'issuerName': this.ISSUER_NAME,
                'programName': 'Space Pass',

                'hexBackgroundColor': '#FFD700',
                'hexForegroundColor': '#000000',
                'reviewStatus': 'UNDER_REVIEW',
                'allowMultipleUsersPerObject': true,
                'locations': [],
                'infoModuleData': {
                    'labelValueRows': [
                        {
                            'columns': [
                                {
                                    'label': 'Programa',
                                    'value': 'Space Pass'
                                }
                            ]
                        }
                    ]
                },
                'textModulesData': [
                    {
                        'header': 'Space Points',
                        'body': '0'
                    }
                ],
                'linksModuleData': {
                    'uris': [
                        {
                            'uri': 'https://spacecards-loyalty.onrender.com',
                            'description': 'Visitar Space Cards Store'
                        }
                    ]
                },
                'imageModulesData': [
                    {
                        'mainImage': {
                            'kind': 'walletobjects#image',
                            'sourceUri': {
                                'uri': 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1200/https://cdn.gamma.app/6z3bcs8x5oe1qvh/c027b610096c425b945c5a5fa6f703ed/original/Copia-de-Logo-whats.jpg',
                                'description': 'Space Cards Background'
                            }
                        }
                    }
                ]
            };

            console.log('Objeto loyaltyClass creado:', JSON.stringify(loyaltyClass, null, 2));

            try {
                // Intentar obtener la clase existente
                console.log('Intentando obtener clase existente...');
                const existingClass = await this.client.loyaltyclass.get({ resourceId: this.CLASS_ID });
                console.log('Clase existente encontrada:', existingClass);
                
                console.log('Actualizando clase existente...');
                const updatedClass = await this.client.loyaltyclass.update({
                    resourceId: this.CLASS_ID,
                    requestBody: loyaltyClass
                });
                console.log('Clase actualizada exitosamente:', updatedClass);
            } catch (error) {
                console.log('Error al obtener/actualizar clase:', error.response?.data || error);
                
                if (error.response?.status === 404) {
                    console.log('Clase no encontrada, creando nueva...');
                    const newClass = await this.client.loyaltyclass.insert({
                        requestBody: loyaltyClass
                    });
                    console.log('Nueva clase creada exitosamente:', newClass);
                } else {
                    throw error;
                }
            }

            console.log('Clase de lealtad creada/actualizada exitosamente');
        } catch (error) {
            console.error('Error al crear/actualizar clase de lealtad:', error);
            throw error;
        }
    }
}

module.exports = new GoogleWalletService();
