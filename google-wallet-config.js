require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const CLASS_ID = `${ISSUER_ID}.pokemon_loyalty_card`;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

// Configurar autenticación usando credenciales de servicio
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    keyFile: './google-wallet-key.json' // Archivo de credenciales de servicio
});

const loyaltyClass = {
    id: CLASS_ID,
    issuerName: 'Mamitas Tepic',
    programName: 'Programa de Lealtad Pokémon',
    programLogo: {
        sourceUri: {
            uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
        }
    },
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: '#FF5733',
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
    CLIENT_ID,
    loyaltyClass
};
