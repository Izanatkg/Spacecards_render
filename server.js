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

// Routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.post('/register', async (req, res) => {
    console.log('Starting registration process...');
    try {
        const { fullName, email, phone, isQRRegistration } = req.body;
        
        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar formato de teléfono (10 dígitos)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono debe tener 10 dígitos'
            });
        }

        // Generar ID numérico para el cliente
        const customerId = await getNextCustomerId();
        const customerIdStr = customerId.toString();
        
        console.log('Creating customer in Loyverse...');
        // Register user in Loyverse
        const loyverseCustomerData = {
            name: fullName,
            email: email,
            phone_number: phone,
            customer_code: customerIdStr, // Campo correcto para el código de cliente
            note: "Registrado desde el Sistema de lealtad",
            loyalty_program_enabled: true
        };

        console.log('Sending to Loyverse:', JSON.stringify(loyverseCustomerData, null, 2));
        const loyverseResponse = await loyverseApi.post('/customers', loyverseCustomerData);

        if (!loyverseResponse.data || !loyverseResponse.data.id) {
            console.error('Invalid Loyverse response:', loyverseResponse.data);
            return res.status(400).json({
                success: false,
                message: 'Error al crear cliente en Loyverse'
            });
        }

        console.log('Loyverse customer created:', loyverseResponse.data);

        // Generar QR code con el ID numérico
        const qrCode = await QRCode.toDataURL(customerIdStr, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        // Crear pase de Google Wallet
        console.log('Creating Google Wallet pass...');
        let walletUrl = null;
        try {
            console.log('Creating wallet pass for user:', loyverseResponse.data.id);
            walletUrl = await googleWalletService.createLoyaltyObject(
                loyverseResponse.data.id,
                {
                    name: fullName,
                    email: email,
                    reference_id: customerIdStr
                }
            );
            console.log('Wallet URL generated:', walletUrl);
        } catch (error) {
            console.error('Error creating Google Wallet pass:', error);
            // No retornamos error, continuamos con el registro
        }

        console.log('Registration process completed successfully');
        return res.status(201).json({
            success: true,
            message: walletUrl ? "Usuario registrado exitosamente" : "Usuario registrado exitosamente, pero hubo un problema al crear la tarjeta de Google Wallet",
            welcomeBonus: "10% en tu primera compra",
            user: {
                fullName,
                email,
                phone,
                loyverseId: loyverseResponse.data.id,
                customerId: customerIdStr,
                isQRRegistration
            },
            qrCode: qrCode,
            walletUrl: walletUrl
        });
    } catch (error) {
        console.error('Registration error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error?.message ||
                           error.message || 
                           "Error al registrar usuario";
        return res.status(400).json({
            success: false,
            message: errorMessage
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

// Catch-all route to serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-new/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
