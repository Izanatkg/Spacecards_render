const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const axios = require('axios');
const googleWalletService = require('./google-wallet-service');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

const app = express();
const LOYVERSE_TOKEN = '68c66646696548af983a2a0b8e64c2ec';
const LOYVERSE_API_URL = 'https://api.loyverse.com/v1.0';
const COUNTER_FILE = path.join(__dirname, 'customer_counter.txt');
const WELCOME_POINTS = 100; // Puntos de bienvenida

// Función para obtener y actualizar el contador de clientes
async function getNextCustomerId() {
    try {
        // Intentar leer el archivo
        const counter = await fs.readFile(COUNTER_FILE, 'utf8');
        const nextId = parseInt(counter) + 1;
        // Guardar el nuevo contador
        await fs.writeFile(COUNTER_FILE, nextId.toString());
        return nextId;
    } catch (error) {
        // Si el archivo no existe, comenzar desde 600000
        await fs.writeFile(COUNTER_FILE, '600001');
        return 600000;
    }
}

// Configurar cliente de Loyverse
const loyverseApi = axios.create({
    baseURL: LOYVERSE_API_URL,
    headers: {
        'Authorization': `Bearer ${LOYVERSE_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// CORS configuration
app.use(cors());

app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client-new/build')));

// Debug middleware for logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST') {
        console.log('Request body:', req.body);
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error middleware:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

// Test Loyverse connection on startup
loyverseApi.get('/stores')
    .then(response => {
        console.log('Successfully connected to Loyverse API');
        console.log('Store information:', response.data);
    })
    .catch(error => {
        console.error('Error connecting to Loyverse:', error.response?.data || error.message);
    });

// Función para añadir puntos a un cliente en Loyverse
async function addPointsToCustomer(customerId, points) {
    try {
        console.log(`Adding ${points} points to customer ${customerId}`);
        
        // Crear una transacción de puntos usando el endpoint de mercancías
        const transactionResponse = await loyverseApi.post('/merchandise_points', {
            customer_id: customerId,
            points: points,
            store_id: 'b7e82499-21b0-4e9d-aae5-16d90693c77a',
            type: 'EARNING',
            description: "Puntos de bienvenida"
        });

        console.log('Points transaction response:', transactionResponse.data);
        
        // Esperar un momento para que los puntos se actualicen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Obtener el cliente actualizado para verificar los puntos
        const customerResponse = await loyverseApi.get(`/customers/${customerId}`);
        console.log('Updated customer data:', customerResponse.data);
        return customerResponse.data;
    } catch (error) {
        console.error('Error adding points:', error.response?.data || error.message);
        
        // Si falla, intentar con el endpoint de puntos directo
        try {
            console.log('Trying direct points update...');
            const updateResponse = await loyverseApi.put(`/customers/${customerId}`, {
                total_points: points
            });
            
            console.log('Direct points update response:', updateResponse.data);
            return updateResponse.data;
        } catch (updateError) {
            console.error('Error in direct points update:', updateError.response?.data || updateError.message);
            throw updateError;
        }
    }
}

// Routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;

        // Validar datos requeridos
        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe en Loyverse
        try {
            const existingCustomers = await loyverseApi.get('/customers', {
                params: {
                    email: email
                }
            });

            if (existingCustomers.data.customers && existingCustomers.data.customers.length > 0) {
                const existingCustomer = existingCustomers.data.customers[0];
                
                // Generar código QR
                const qrCode = await QRCode.toDataURL(existingCustomer.customer_code);

                // Crear o actualizar pase de Google Wallet
                const walletUrl = await googleWalletService.createLoyaltyPass({
                    customerId: existingCustomer.customer_code,
                    name: existingCustomer.name,
                    email: existingCustomer.email,
                    points: existingCustomer.total_points || 0
                });

                return res.json({
                    success: true,
                    id: existingCustomer.customer_code,
                    name: existingCustomer.name,
                    email: existingCustomer.email,
                    points: existingCustomer.total_points || 0,
                    qrCode: qrCode,
                    walletUrl: walletUrl,
                    welcomeBonus: 'Usuario ya registrado'
                });
            }
        } catch (error) {
            console.error('Error checking existing customer:', error);
        }

        // Si el usuario no existe, continuar con el registro
        const customerId = await getNextCustomerId();
        const customerIdStr = customerId.toString();

        const loyverseCustomerData = {
            name: fullName,
            email: email,
            phone_number: phone,
            customer_code: customerIdStr,
            note: "Registrado desde el Sistema de lealtad",
            loyalty_program_enabled: true,
            total_points: WELCOME_POINTS // Intentar establecer los puntos directamente
        };

        try {
            // Crear cliente en Loyverse
            const loyverseResponse = await loyverseApi.post('/customers', loyverseCustomerData);
            console.log('Loyverse customer created:', loyverseResponse.data);

            let updatedCustomer;
            if (!loyverseResponse.data.total_points || loyverseResponse.data.total_points < WELCOME_POINTS) {
                // Si los puntos no se establecieron en la creación, intentar añadirlos después
                updatedCustomer = await addPointsToCustomer(loyverseResponse.data.id, WELCOME_POINTS);
                console.log('Customer after points update:', updatedCustomer);
            } else {
                updatedCustomer = loyverseResponse.data;
            }

            const qrCode = await QRCode.toDataURL(customerIdStr);

            const walletUrl = await googleWalletService.createLoyaltyPass({
                customerId: customerIdStr,
                name: fullName,
                email: email,
                points: updatedCustomer.total_points || WELCOME_POINTS
            });

            res.json({
                success: true,
                id: customerIdStr,
                name: fullName,
                email: email,
                points: updatedCustomer.total_points || WELCOME_POINTS,
                qrCode: qrCode,
                walletUrl: walletUrl,
                welcomeBonus: `¡Bienvenido! Has recibido ${WELCOME_POINTS} PokéPuntos de regalo`
            });

        } catch (error) {
            console.error('Error creating customer:', error.response?.data || error.message);
            if (error.response?.data?.errors?.[0]?.code === 'INVALID_VALUE') {
                res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al crear el cliente en Loyverse'
                });
            }
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el registro'
        });
    }
});

// Generate QR Code endpoint
apiRouter.get('/generate-qr', async (req, res) => {
    try {
        const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?qr=true`;
        const qrCode = await QRCode.toDataURL(registrationUrl);
        res.json({ success: true, qrCode });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            message: "Error al generar código QR"
        });
    }
});

// Actualizar puntos en Google Wallet
apiRouter.post('/update-points', async (req, res) => {
    try {
        const { userId, points } = req.body;
        if (!userId || points === undefined) {
            return res.status(400).json({
                success: false,
                message: "Se requiere userId y points"
            });
        }

        await googleWalletService.updateLoyaltyPoints(userId, points);
        res.json({ 
            success: true, 
            message: 'Puntos actualizados correctamente' 
        });
    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar puntos"
        });
    }
});

// Endpoint para actualizar puntos
app.post('/api/points/update', async (req, res) => {
    try {
        const { customer_id } = req.body;

        if (!customer_id) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el ID del cliente'
            });
        }

        // Obtener información actualizada del cliente desde Loyverse
        const customerResponse = await loyverseApi.get(`/customers/${customer_id}`);
        const customer = customerResponse.data;

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Actualizar el pase de Google Wallet con los puntos actualizados
        const walletUrl = await googleWalletService.createLoyaltyPass({
            customerId: customer.customer_code,
            name: customer.name,
            email: customer.email,
            points: customer.points || 0
        });

        res.json({
            success: true,
            points: customer.points || 0,
            walletUrl: walletUrl
        });

    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los puntos'
        });
    }
});

// Webhook para escuchar cambios de puntos en Loyverse
app.post('/api/loyverse/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        // Verificar si es un evento de actualización de puntos
        if (type === 'customer.updated') {
            const customer_id = data.id;

            // Obtener información actualizada del cliente
            const customerResponse = await loyverseApi.get(`/customers/${customer_id}`);
            const customer = customerResponse.data;

            // Actualizar el pase de Google Wallet
            await googleWalletService.createLoyaltyPass({
                customerId: customer.customer_code,
                name: customer.name,
                email: customer.email,
                points: customer.points || 0
            });

            console.log(`Updated wallet for customer ${customer.name} with ${customer.points} points`);
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing webhook'
        });
    }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-new/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
