# Orders Microservice

Este proyecto es un microservicio para la gestión de órdenes, desarrollado con NestJS.

## Requisitos

Asegúrate de tener instalados los siguientes requisitos antes de comenzar:

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- Docker (opcional, para ejecutar servicios en contenedores)

## Instalación

1. Clona este repositorio:

    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd orders-ms
    ```

2. Instala las dependencias:

    ```bash
    npm install
    ```

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto y configura las variables de entorno necesarias. Puedes usar el archivo `.env.example` como referencia:

    ```bash
    cp .env.example .env
    ```

2. Configura las variables de entorno según tu entorno local.

## Ejecución del Proyecto

### Desarrollo

Para ejecutar el proyecto en modo desarrollo:

```bash
bun run start:dev
```

### Producción

Para construir y ejecutar el proyecto en modo producción:

```bash
bun run build
bun run start:prod
```

## Pruebas

Ejecuta las pruebas unitarias con:

```bash
bun run test
```

Ejecuta las pruebas de integración con:

```bash
bun run test:e2e
```

## Uso con Docker

1. Construye la imagen de Docker:

    ```bash
    docker build -t orders-ms .
    ```

2. Ejecuta el contenedor:

    ```bash
    docker run -p 3000:3000 --env-file .env orders-ms
    ```