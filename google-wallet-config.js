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
    issuerName: process.env.ISSUER_NAME || 'Mamitas Tepic',
    programName: process.env.PROGRAM_NAME || 'Programa de Lealtad Pokémon',
    programLogo: {
        sourceUri: {
            uri: process.env.PROGRAM_LOGO || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
        }
    },
    reviewStatus: 'ACTIVE',
    hexBackgroundColor: process.env.HEX_BACKGROUND_COLOR || '#FF5733',
    heroImage: {
        sourceUri: {
            uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
        }
    },
    locations: [
        {
            address: {
                addressLines: ['Dirección de Mamitas Tepic'],
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
