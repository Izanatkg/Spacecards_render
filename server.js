const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const axios = require('axios');
const googleWalletService = require('./google-wallet-service');

dotenv.config();

const app = express();
const LOYVERSE_TOKEN = '68c66646696548af983a2a0b8e64c2ec';
const LOYVERSE_API_URL = 'https://api.loyverse.com/v1.0';

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

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

// Loyverse API integration
const loyverseApi = axios.create({
    baseURL: LOYVERSE_API_URL,
    headers: {
        'Authorization': `Bearer ${LOYVERSE_TOKEN}`,
        'Content-Type': 'application/json'
    }
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
app.post('/api/register', async (req, res) => {
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

        console.log('Creating customer in Loyverse...');
        // Register user in Loyverse
        const loyverseCustomerData = {
            name: fullName,
            email: email,
            phone_number: phone,
            note: isQRRegistration ? "Registro desde QR" : "Registro web",
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

        // Crear pase de Google Wallet
        console.log('Creating Google Wallet pass...');
        try {
            const walletUrl = await googleWalletService.createLoyaltyObject(
                loyverseResponse.data.id,
                {
                    name: fullName,
                    email: email
                }
            );

            console.log('Registration process completed successfully');
            return res.status(201).json({
                success: true,
                message: "Usuario registrado exitosamente",
                welcomeBonus: "10% en tu primera compra",
                user: {
                    fullName,
                    email,
                    phone,
                    loyverseId: loyverseResponse.data.id,
                    isQRRegistration
                },
                walletUrl: walletUrl
            });
        } catch (walletError) {
            console.error('Wallet error:', walletError);
            return res.status(201).json({
                success: true,
                message: "Usuario registrado exitosamente, pero hubo un problema al crear la tarjeta de Google Wallet",
                user: {
                    fullName,
                    email,
                    phone,
                    loyverseId: loyverseResponse.data.id,
                    isQRRegistration
                },
                walletError: 'No se pudo crear la tarjeta de Google Wallet. Por favor intente más tarde.'
            });
        }
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
app.get('/api/generate-qr', async (req, res) => {
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
app.post('/api/update-points', async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
