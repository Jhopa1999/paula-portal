# Paula Portal

Portal Web interno para operar las conversaciones de **Bot Paula**.
Monorepo TypeScript (npm workspaces).

## Estructura

```text
paula-portal/
  apps/
    web/        # Frontend Angular + TypeScript
    api/        # Backend NestJS + TypeScript (backend de la Web, no del bot)
  libs/
    contracts/  # DTOs y contratos compartidos entre web y api
  specs/        # Referencia SDD (opcional)
```

## Principio arquitectonico

```text
Angular  ->  NestJS (Web API)  ->  Bot Core APIs / Commands / Events
```

La Web **no** accede directamente a DynamoDB, Bedrock ni WhatsApp.

## Requisitos

- Node.js >= 20 (probado con 24)
- npm >= 10

## Puesta en marcha (dev)

```bash
# desde la raiz del monorepo
npm install

# construir los contratos compartidos
npm run build:contracts

# API NestJS (http://localhost:3000)
npm run start:api

# Web Angular (http://localhost:4200)
npm run start:web
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores. No subas `.env` al repositorio.

## Comandos utiles

```bash
npm run build     # construye contracts + api + web
npm run lint      # lint en todos los workspaces
npm run test      # tests en todos los workspaces
```
