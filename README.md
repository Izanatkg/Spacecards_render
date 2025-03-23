# Sistema de Lealtad Pokémon

Sistema de lealtad para Mamitas Tepic que integra Loyverse POS con Google Wallet.

## Características

- Registro de clientes con generación automática de códigos QR
- Integración con Loyverse para gestión de puntos
- Integración con Google Wallet para tarjetas de lealtad digitales
- Interfaz moderna y responsiva
- Sistema de bonificación para nuevos clientes

## Requisitos

- Node.js v16 o superior
- Cuenta de Loyverse con API habilitada
- Cuenta de Google Cloud con API de Google Wallet habilitada

## Configuración

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd pokemon-loyalty-system
```

2. Instalar dependencias:
```bash
npm install
cd client-new
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con:
```
LOYVERSE_API_TOKEN=<tu-token-de-loyverse>
```

4. Configurar Google Wallet:
- Colocar el archivo de credenciales de Google Cloud (`puntos-loyvers-2b7433c755f0.json`) en la raíz del proyecto

## Desarrollo

1. Iniciar el servidor:
```bash
npm start
```

2. En otra terminal, iniciar el cliente:
```bash
cd client-new
npm start
```

## Producción

Para construir la versión de producción:

```bash
cd client-new
npm run build
```

## API Endpoints

- `POST /api/register`: Registra un nuevo cliente
- `GET /api/customer/:id`: Obtiene información de un cliente
- `PUT /api/points/:id`: Actualiza los puntos de un cliente

## Tecnologías

- Backend: Node.js, Express
- Frontend: React, Material-UI
- APIs: Loyverse, Google Wallet
- Base de datos: MongoDB (pendiente de implementar)

## Licencia

Este proyecto es privado y confidencial.
