# TicoAutos

TicoAutos es una plataforma web para publicar, consultar y administrar vehiculos en venta. El proyecto mantiene la base que ya tenias: backend REST con Express y MongoDB local, frontend en HTML/CSS/JavaScript vanilla, JWT para autenticacion y separacion por `routes`, `controllers`, `models` y `middleware`.

## Estado actual

El proyecto ahora incluye:

- registro de usuarios
- login con JWT
- logout y ruta `me`
- hash de contrasena con `bcryptjs`
- CRUD completo de vehiculos
- filtros combinables desde backend
- paginacion real
- detalle publico del vehiculo con datos basicos del propietario
- carga de una o varias imagenes por vehiculo
- enlace publico compartible por vehiculo
- conversaciones por vehiculo entre interesado y propietario
- bandeja de mensajes para el propietario
- listado de conversaciones iniciadas por el interesado
- historial persistente de mensajes
- indicador de mensajes pendientes en la interfaz

## Tecnologias

- Node.js
- Express
- MongoDB local
- Mongoose
- JSON Web Token
- Multer
- HTML
- CSS
- JavaScript vanilla

## Estructura del proyecto

```text
TicoAutosPrueba/
|-- Backend-TicoAutoss/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- uploads/
|   |-- .env.example
|   |-- index.js
|   `-- package.json
|-- Frontend-TicoAutos/
|   |-- assets/
|   |-- css/
|   |-- js/
|   |-- index.html
|   |-- login.html
|   |-- register.html
|   |-- createVehicle.html
|   |-- editVehicle.html
|   |-- vehicle.html
|   `-- questions.html
`-- postman/
    `-- TicoAutos.postman_collection.json
```

## Configuracion del backend

1. Entra a la carpeta del backend:

```bash
cd Backend-TicoAutoss
```

2. Instala dependencias:

```bash
npm install
```

3. Crea tu archivo `.env` tomando como base `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/Proyecto11
JWT_SECRET=pon-aqui-un-secreto-largo-y-seguro
JWT_EXPIRES_IN=7d
```

4. Asegurate de tener MongoDB local activo.

5. Ejecuta el backend:

```bash
npm run dev
```

## Ejecucion del frontend

El frontend es estatico. Puedes abrirlo con Live Server o cualquier servidor simple de archivos.

Ruta recomendada de inicio:

- `Frontend-TicoAutos/index.html`

El frontend consume la API en:

```text
http://localhost:3000
```

Si cambias el puerto del backend, actualiza `Frontend-TicoAutos/js/app.js`.

## Uso de JWT

El login devuelve un token JWT firmado.

Header esperado en rutas privadas:

```http
Authorization: Bearer <token>
```

El frontend guarda el token y el usuario autenticado en `localStorage`.

## Endpoints principales

### Auth

- `POST /api/users/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Vehicles

- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `GET /api/vehicles/:id/conversation`
- `POST /api/vehicles`
- `POST /api/vehicles/:id/messages`
- `PUT /api/vehicles/:id`
- `PATCH /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `PATCH /api/vehicles/:id/sold`

### Messages

- `GET /api/messages/mine`
- `GET /api/messages/inbox`
- `GET /api/messages/conversations/:id`
- `POST /api/messages/conversations/:id/messages`

## Filtros disponibles en vehiculos

`GET /api/vehicles` acepta estos query params:

- `brand`
- `model`
- `status`
- `minYear`
- `maxYear`
- `minPrice`
- `maxPrice`
- `page`
- `limit`

Ejemplo:

```text
GET /api/vehicles?brand=Toyota&minYear=2018&maxPrice=15000000&page=1&limit=6
```

Los filtros se aplican en el backend y la respuesta devuelve paginacion real.

## Mensajeria por vehiculo

La mensajeria no usa roles fijos de comprador o vendedor. Se define por contexto:

- `ownerId`: usuario que publico el vehiculo
- `interestedUserId`: usuario autenticado que contacta por ese vehiculo

Reglas implementadas:

- solo usuarios autenticados pueden enviar mensajes
- nadie puede enviarse mensajes a si mismo
- cada conversacion se agrupa por vehiculo + propietario + interesado
- si una persona vuelve a escribir por el mismo vehiculo, se reutiliza la misma conversacion
- solo el propietario del vehiculo y la persona interesada pueden abrir ese historial
- el propietario ve mensajes pendientes en su bandeja

## Imagenes por vehiculo

Al crear o editar un vehiculo puedes subir varias imagenes.

- se reciben en `multipart/form-data`
- se guardan en `Backend-TicoAutoss/uploads/vehicles`
- se exponen por `/uploads/...`
- el detalle del vehiculo muestra galeria visual con varias imagenes

## Flujo recomendado de prueba

1. Registrar usuario propietario
2. Hacer login como propietario
3. Crear vehiculo
4. Listar vehiculos
5. Ver detalle del vehiculo
6. Registrar usuario interesado
7. Hacer login como interesado
8. Enviar mensaje al propietario desde el detalle del vehiculo
9. Ver la conversacion en `Mis conversaciones`
10. Hacer login otra vez como propietario
11. Abrir `Mensajes` y revisar `Mensajes pendientes`
12. Responder la conversacion
13. Confirmar que el historial se mantiene al volver a entrar
14. Marcar vehiculo como vendido

## Postman

La coleccion lista para importar esta en:

- `postman/TicoAutos.postman_collection.json`

Incluye carpetas:

- Auth
- Vehicles
- Messages

Y variables de coleccion:

- `baseUrl`
- `ownerToken`
- `buyerToken`
- `vehicleId`
- `conversationId`

## Buenas practicas aplicadas

- separacion por modelos, rutas, controladores y middleware
- validaciones de entrada en backend y frontend
- JWT con middleware de autenticacion
- autorizacion por propietario real del vehiculo
- respuestas JSON consistentes
- datos sensibles no expuestos en respuestas publicas
- frontend simple de mantener y facil de defender
