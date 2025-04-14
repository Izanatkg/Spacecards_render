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
            'id': this.CLASS_ID,
            'issuerName': this.ISSUER_NAME,
            'programName': 'Space Pass',
            'hexBackgroundColor': '#1a1f2e',
            'hexFontColor': '#ffd700',
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
            'linksModuleData': {
                'uris': [
                    {
                        'uri': 'https://maps.app.goo.gl/VznNTGWCky27k2N4A',
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
            ],
            'messages': [
                {
                    'header': 'Bienvenido a Space Pass',
                    'body': 'Escanea este código para acumular puntos'
                }
            ]
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
                barcode: {
                    type: 'QR_CODE',
                    value: id,
                    alternateText: id
                },
                cardTitle: {
                    defaultValue: {
                        language: 'es',
                        value: 'Space Pass'
                    }
                },
                header: {
                    defaultValue: {
                        language: 'es',
                        value: 'Space Pass'
                    }
                },
                hexBackgroundColor: '#1a1f2e',
                hexFontColor: '#ffd700',
                loyaltyPoints: {
                    balance: {
                        int: parseInt(points)
                    },
                    label: 'Space Points'
                },
                textModulesData: [
                    {
                        id: 'points',
                        header: 'Space Points',
                        body: points.toString()
                    }
                ],
                messages: [
                    {
                        header: 'Space Pass',
                        body: 'Gracias por tu lealtad'
                    }
                ]
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
            const walletUrl = `https://maps.app.goo.gl/VznNTGWCky27k2N4A`;
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

                console.log('Actualizando puntos en Google Wallet...');
                
                // Actualizar campos necesarios manteniendo el estado activo
                const updateObject = {
                    state: 'ACTIVE',
                    loyaltyPoints: {
                        balance: {
                            int: parseInt(points)
                        },
                        label: 'Space Points'
                    },
                    textModulesData: [
                        {
                            id: 'points',
                            header: 'Space Points',
                            body: points.toString()
                        }
                    ]
                };
                
                console.log('Datos de actualización:', JSON.stringify(updateObject, null, 2));
                
                // Usar patch para actualizar los campos
                const result = await this.client.loyaltyobject.patch({
                    resourceId: objectId,
                    requestBody: updateObject
                });
                
                console.log('Puntos actualizados correctamente');

                return true;
            } catch (error) {
                if (error.response?.status === 404) {
                    console.error('Loyalty object not found, creating new one...');
                    // Si el objeto no existe, crearlo
                    await this.createLoyaltyObject({ 
                        id: userId, 
                        name: 'Cliente Space Pass', 
                        email: `user-${userId}@pokepuntos.com`, 
                        points,
                        cardTitle: {
                            defaultValue: {
                                language: 'es',
                                value: 'Space Pass'
                            }
                        }
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
            console.log('Creando pase para:', { customerId, customerName, points });
            
            // Crear el objeto de lealtad
            await this.createLoyaltyObject({
                id: customerId,
                name: customerName,
                email: `${customerId}@pokepuntos.com`,
                points: points
            });

            // Generar el link de Google Wallet
            const claims = {
                iss: this.credentials.client_email,
                aud: 'google',
                origins: ['https://maps.app.goo.gl/VznNTGWCky27k2N4A'],
                typ: 'savetowallet',
                payload: {
                    loyaltyObjects: [{
                        id: `${this.CLASS_ID}.${customerId}`,
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
                'hexBackgroundColor': '#1a1f2e',
                'hexFontColor': '#ffd700',
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
                'linksModuleData': {
                    'uris': [
                        {
                            'uri': 'https://maps.app.goo.gl/VznNTGWCky27k2N4A',
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
                ],
                'messages': [
                    {
                        'header': 'Bienvenido a Space Pass',
                        'body': 'Escanea este código para acumular puntos'
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
