# Orders Microservice

Este proyecto es un microservicio para la gestión de órdenes, desarrollado con NestJS.

## Requisitos

Asegúrate de tener instalados los siguientes requisitos antes de comenzar:

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- Docker (opcional, para ejecutar servicios y bases de datos en contenedores)

## Development pasos

1. Clonar el proyecto
2. Crear un archivo `.env` basado en el archivo `.env.template`
3. Levantar la base de datos con `docker compose up -d`
4. Levantarel servidor de Nats
```
docker run -d --name nats-server -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
```
5. Levantar el proyecto con `npm run start:dev`