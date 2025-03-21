# Pokémon Loyalty System

Sistema de lealtad temático de Pokémon integrado con Google Wallet y Loyverse POS.

## Características

- Registro de usuarios con tarjeta de lealtad digital
- Integración con Google Wallet para tarjetas digitales
- Integración con Loyverse POS para gestión de clientes
- Diseño temático de Pokémon
- Sistema de puntos y recompensas
- Registro mediante QR

## Tecnologías

- **Backend**: Node.js con Express
- **Frontend**: React con Material-UI
- **APIs**: 
  - Google Wallet API
  - Loyverse API
- **Base de datos**: Loyverse (gestión de clientes y puntos)

## Requisitos

- Node.js 16 o superior
- Cuenta de Google Cloud con Google Wallet API habilitada
- Cuenta de Loyverse POS
- Credenciales de servicio de Google Cloud

## Configuración

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/pokemon-loyalty-system.git
cd pokemon-loyalty-system
```

2. Instala las dependencias:
```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client
npm install
```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las siguientes variables:
```env
LOYVERSE_TOKEN=tu_token_de_loyverse
FRONTEND_URL=http://localhost:3000
GOOGLE_WALLET_ISSUER_ID=tu_issuer_id
PORT=5000
```

4. Configura las credenciales de Google Wallet:
   - Coloca el archivo `google-wallet-key.json` en la raíz del proyecto

## Uso

1. Inicia el servidor:
```bash
npm start
```

2. En otra terminal, inicia el cliente:
```bash
cd client
npm start
```

3. Abre http://localhost:3000 en tu navegador

## Estructura del Proyecto

```
pokemon-loyalty-system/
├── client/                 # Frontend React
├── google-wallet-config.js # Configuración de Google Wallet
├── google-wallet-service.js# Servicios de Google Wallet
├── server.js              # Servidor Express
└── README.md
```

## Licencia

MIT
