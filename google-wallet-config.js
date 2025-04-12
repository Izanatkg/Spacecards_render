require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

// Usar variables de entorno o valores por defecto
const ISSUER_ID = process.env.ISSUER_ID || '3388000000022884108';
const CLASS_ID = process.env.CLASS_ID || `${ISSUER_ID}.pokemon_loyalty_card`;

let credentials;
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } else {
        credentials = require('./puntos-loyvers-2b7433c755f0.json');
    }
} catch (error) {
    console.error('Error loading Google credentials:', error);
    throw error;
}

// Configurar autenticación usando credenciales de servicio
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    credentials
});

const loyaltyClass = {
    id: CLASS_ID,
    issuerName: {
        kind: "walletobjects#localizedString",
        defaultValue: {
            language: "es",
            value: process.env.ISSUER_NAME || 'Mamitas Tepic'
        }
    },
    programName: {
        kind: "walletobjects#localizedString",
        defaultValue: {
            language: "es",
            value: "Space Cards"
        }
    },

    reviewStatus: 'ACTIVE',
    hexBackgroundColor: '#D4AF37',
    hexForegroundColor: '#000000',

    locations: [
        {
            address: {
                addressLines: ['Av. México 324, San Juan'],
                locality: 'Tepic',
                administrativeArea: 'Nayarit',
                countryCode: 'MX'
            }
        }
    ]
};

module.exports = {
    auth,
    ISSUER_ID,
    CLASS_ID,
    loyaltyClass,
    credentials
};
