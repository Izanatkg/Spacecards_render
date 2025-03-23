<<<<<<< HEAD
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
=======
**Edit a file, create a new file, and clone from Bitbucket in under 2 minutes**

When you're done, you can delete the content in this README and update the file with details for others getting started with your repository.

*We recommend that you open this README in another tab as you perform the tasks below. You can [watch our video](https://youtu.be/0ocf7u76WSo) for a full demo of all the steps in this tutorial. Open the video in a new tab to avoid leaving Bitbucket.*

---

## Edit a file

You’ll start by editing this README file to learn how to edit a file in Bitbucket.

1. Click **Source** on the left side.
2. Click the README.md link from the list of files.
3. Click the **Edit** button.
4. Delete the following text: *Delete this line to make a change to the README from Bitbucket.*
5. After making your change, click **Commit** and then **Commit** again in the dialog. The commit page will open and you’ll see the change you just made.
6. Go back to the **Source** page.

---

## Create a file

Next, you’ll add a new file to this repository.

1. Click the **New file** button at the top of the **Source** page.
2. Give the file a filename of **contributors.txt**.
3. Enter your name in the empty file space.
4. Click **Commit** and then **Commit** again in the dialog.
5. Go back to the **Source** page.

Before you move on, go ahead and explore the repository. You've already seen the **Source** page, but check out the **Commits**, **Branches**, and **Settings** pages.

---

## Clone a repository

Use these steps to clone from SourceTree, our client for using the repository command-line free. Cloning allows you to work on your files locally. If you don't yet have SourceTree, [download and install first](https://www.sourcetreeapp.com/). If you prefer to clone from the command line, see [Clone a repository](https://confluence.atlassian.com/x/4whODQ).

1. You’ll see the clone button under the **Source** heading. Click that button.
2. Now click **Check out in SourceTree**. You may need to create a SourceTree account or log in.
3. When you see the **Clone New** dialog in SourceTree, update the destination path and name if you’d like to and then click **Clone**.
4. Open the directory you just created to see your repository’s files.

Now that you're more familiar with your Bitbucket repository, go ahead and add a new file locally. You can [push your change back to Bitbucket with SourceTree](https://confluence.atlassian.com/x/iqyBMg), or you can [add, commit,](https://confluence.atlassian.com/x/8QhODQ) and [push from the command line](https://confluence.atlassian.com/x/NQ0zDQ).
>>>>>>> 097c320b622000a47b76a7277356e266a1ffc904
