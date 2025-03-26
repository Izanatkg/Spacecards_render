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
        let counter;
        try {
            // Intentar leer el archivo
            counter = await fs.readFile(COUNTER_FILE, 'utf8');
        } catch (error) {
            // Si el archivo no existe, crear con valor inicial
            await fs.writeFile(COUNTER_FILE, '0');
            counter = '0';
        }

        const nextId = parseInt(counter) + 1;
        // Asegurarnos que el ID tenga 6 dígitos
        const paddedId = nextId.toString().padStart(6, '0');
        
        // Guardar el nuevo contador
        await fs.writeFile(COUNTER_FILE, nextId.toString());
        
        return paddedId;
    } catch (error) {
        console.error('Error managing customer counter:', error);
        // En caso de error, generar un ID basado en timestamp
        const timestamp = Date.now().toString().slice(-6);
        return timestamp;
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
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client-new/build')));

// Debug middleware for logging requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
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

// Configurar rutas API
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Ruta de registro
app.post('/register', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Generar el código de cliente
        const customerCode = await getNextCustomerId();
        
        // Registrar en Loyverse
        const customerData = {
            name: name,
            email: email,
            phone_number: phone,
            total_points: process.env.WELCOME_POINTS || 100,
            loyalty_program_enabled: true,
            note: `Customer ID: ${customerCode}`
        };

        const response = await axios.post('https://api.loyverse.com/v1.0/customers', customerData, {
            headers: {
                'Authorization': `Bearer ${process.env.LOYVERSE_TOKEN}`
            }
        });

        // Generar QR Code
        const qrCode = await QRCode.toDataURL(customerCode);

        // Crear pase de Google Wallet
        const walletUrl = await googleWalletService.createLoyaltyObject(customerCode, {
            name,
            email,
            phone
        });

        console.log('Wallet URL generated:', walletUrl);

        res.json({
            success: true,
            customer_code: customerCode,
            qrCode: qrCode,
            walletUrl: walletUrl
        });

    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

let lastKnownPoints = {};

// Objeto para almacenar los intervalos de polling por usuario
const pollingIntervals = {};

// Función para obtener puntos actuales de Loyverse
async function getLoyversePoints(customerId) {
    try {
        console.log('Getting points for customer:', customerId);
        const response = await loyverseApi.get(`/customers/${customerId}`);
        console.log('Loyverse response:', response.data);
        return response.data.total_points || 0;
    } catch (error) {
        console.error('Error getting Loyverse points:', error.response?.data || error);
        // Si el error es 400, intentar buscar por customer_code
        if (error.response?.status === 400) {
            try {
                const searchResponse = await loyverseApi.get('/customers', {
                    params: {
                        customer_code: customerId
                    }
                });
                if (searchResponse.data.customers && searchResponse.data.customers.length > 0) {
                    const customer = searchResponse.data.customers[0];
                    return customer.total_points || 0;
                }
            } catch (searchError) {
                console.error('Error searching customer:', searchError.response?.data || searchError);
            }
        }
        return null;
    }
}

// Función para actualizar el pase de Google Wallet
async function updateWalletPass(customerId) {
    try {
        const points = await getLoyversePoints(customerId);
        if (points === null) return;

        // Solo actualizar si los puntos han cambiado
        if (lastKnownPoints[customerId] !== points) {
            console.log(`Points changed for customer ${customerId}: ${lastKnownPoints[customerId]} -> ${points}`);
            lastKnownPoints[customerId] = points;
            
            // Obtener información del cliente
            let customer;
            try {
                const response = await loyverseApi.get('/customers', {
                    params: {
                        customer_code: customerId
                    }
                });
                if (response.data.customers && response.data.customers.length > 0) {
                    customer = response.data.customers[0];
                } else {
                    throw new Error('Customer not found');
                }
            } catch (error) {
                console.error('Error getting customer info:', error);
                return;
            }

            console.log('Updating Google Wallet pass with new points:', points);

            // Crear el objeto de lealtad actualizado
            await googleWalletService.createLoyaltyObject(customerId, {
                email: customer.email,
                name: customer.name,
                reference_id: customer.customer_code,
                points: points
            });
        }
    } catch (error) {
        console.error('Error updating wallet pass:', error);
    }
}

// Iniciar el polling de puntos para cada usuario
function startPointsPolling(customerId) {
    // Si ya existe un intervalo para este usuario, detenerlo
    if (pollingIntervals[customerId]) {
        clearInterval(pollingIntervals[customerId]);
    }
    
    // Iniciar nuevo intervalo
    console.log(`Starting points polling for customer ${customerId}`);
    pollingIntervals[customerId] = setInterval(() => updateWalletPass(customerId), 5000); // Revisar cada 5 segundos
}

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
apiRouter.post('/points/update', async (req, res) => {
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
apiRouter.post('/loyverse/webhook', async (req, res) => {
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

// Ruta para actualizar puntos desde Loyverse
app.post('/webhook/loyverse', async (req, res) => {
    try {
        const { event_type, data } = req.body;
        console.log('Received webhook:', event_type, data);
        
        // Si es un evento de puntos o transacción
        if (event_type === 'customer_points_changed' || event_type === 'receipt_created') {
            const customerId = data.customer_id || data.customer?.id;
            if (customerId) {
                // Asegurarse de que el polling está activo para este usuario
                startPointsPolling(customerId);
                // Actualizar el pase inmediatamente
                await updateWalletPass(customerId);
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
    }
});

// Handle React routing, return all requests to React app
app.get('*', function(req, res, next) {
    // Skip API routes
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'client-new/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
