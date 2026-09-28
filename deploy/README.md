# Despliegue en servidor interno (origen unico)

El servidor es interno (IP privada, ej. `10.125.17.27`), no accesible desde
internet. Por eso **no usamos Firebase**: el backend NestJS sirve tambien el
frontend Angular compilado. Todo queda en `http://IP_DEL_SERVIDOR:3000`,
un solo origen, sin CORS ni HTTPS externo.

## Requisitos en el servidor

- Node.js >= 20 (probado con v24) y npm
- Git
- PM2 (`npm install -g pm2`) para mantener el proceso vivo y arrancar en boot
- Puerto 3000 abierto en el firewall de Windows para la red interna

## Pasos

### 1. Clonar el repo

```powershell
cd E:\ia-bot-paula
git clone <URL_DEL_REPO> .
```

### 2. Instalar y compilar (contracts -> api -> web)

```powershell
npm install
npm run build
```

`npm run build` compila los tres paquetes en orden. Genera:
- `apps/api/dist/main.js` (backend)
- `apps/web/dist/web/browser` (frontend que el backend sirve)

### 3. Configurar variables de entorno

```powershell
Copy-Item deploy\.env.production.example apps\api\.env
notepad apps\api\.env
```

Con origen unico, `CORS_ORIGIN` casi no importa (frontend y API comparten
origen), pero dejalo con la IP por si acaso:

```
API_PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://10.125.17.27:3000
BOT_CORE_ADAPTER=mock
```

### 4. Abrir el puerto en el firewall de Windows (red interna)

En PowerShell **como administrador**:

```powershell
New-NetFirewallRule -DisplayName "Paula Portal 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 5. Arrancar con PM2

```powershell
npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

`pm2 startup` en Windows requiere el paquete `pm2-windows-startup`:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### 6. Verificar

En el servidor:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/v1/health/live
```

Desde otro equipo de la red interna, abre en el navegador:

```
http://10.125.17.27:3000
```

Debe cargar el portal Paula y poder iniciar sesion con los usuarios mock.

## Actualizaciones futuras

```powershell
git pull
npm install
npm run build
pm2 restart paula-api
```

## Notas

- No subas `apps/api/.env` al repositorio (esta en `.gitignore`).
- El adapter por defecto es `mock`. Cuando exista la API real del Bot Core,
  cambia `BOT_CORE_ADAPTER=http` y completa `BOT_CORE_BASE_URL` / `BOT_CORE_API_KEY`.
- Si mas adelante el portal debe salir a internet, habla con el equipo de redes
  para publicar el servidor con dominio + HTTPS, o mueve el frontend a Firebase
  y expon el backend con certificado.
