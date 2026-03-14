# Documentacion del Codigo - TicoAutos

Este documento explica el proyecto de forma sencilla para que puedas leer el codigo, entender el flujo y defenderlo en una exposicion.

## 1. Idea general del proyecto

TicoAutos es una aplicacion para publicar vehiculos, filtrarlos, ver su detalle y permitir una conversacion entre la persona interesada y la persona que publico el vehiculo.

La arquitectura se mantiene simple:

- `Backend-TicoAutoss`: API REST con Express y MongoDB
- `Frontend-TicoAutos`: interfaz en HTML, CSS y JavaScript vanilla

## 2. Flujo general del sistema

### Flujo de autenticacion

1. El usuario se registra en `POST /api/users/register`
2. El login se hace en `POST /api/auth/login`
3. El backend devuelve un JWT
4. El frontend guarda ese token en `localStorage`
5. Cuando una ruta es privada, el frontend envia:

```http
Authorization: Bearer <token>
```

6. El middleware `authenticateToken` valida el token y carga el usuario autenticado en `req.user`

### Flujo de vehiculos

1. Un usuario autenticado publica un vehiculo
2. El backend valida los datos y guarda el vehiculo en Mongo
3. Si el usuario sube imagenes, se guardan localmente en `uploads/vehicles`
4. La lista publica de vehiculos usa filtros y paginacion desde backend
5. El detalle del vehiculo muestra sus datos, imagenes y propietario basico

### Flujo de mensajeria

1. Un usuario autenticado entra al detalle de un vehiculo ajeno
2. Escribe un mensaje al propietario
3. El backend crea o reutiliza una conversacion por:
   - vehiculo
   - propietario
   - interesado
4. Cada mensaje se guarda como documento independiente
5. El propietario ve la conversacion en su bandeja
6. Cuando responde, el historial sigue en el mismo hilo

## 3. Backend explicado

### `Backend-TicoAutoss/index.js`

Es el punto de entrada del servidor.

Hace estas tareas:

- carga las variables de entorno con `dotenv`
- crea la app de Express
- activa `cors` y `express.json()`
- expone la carpeta `/uploads`
- monta las rutas REST
- conecta con MongoDB
- levanta el servidor

### `Backend-TicoAutoss/models/user.js`

Define el modelo `User`.

Campos importantes:

- `name`
- `lastname`
- `email`
- `password`
- `tokenVersion`

`tokenVersion` se usa para invalidar tokens viejos al hacer logout.

### `Backend-TicoAutoss/models/vehicle.js`

Define el modelo `Vehicle`.

Campos importantes:

- `brand`
- `model`
- `year`
- `price`
- `color`
- `images`
- `status`
- `userId`

`userId` relaciona el vehiculo con su propietario.

### `Backend-TicoAutoss/models/conversation.js`

Representa una conversacion principal.

Relaciona:

- un vehiculo
- el propietario del vehiculo
- la persona interesada

Tambien guarda:

- `lastMessageAt`
- `lastMessageText`
- `ownerUnreadCount`
- `interestedUnreadCount`

### `Backend-TicoAutoss/models/message.js`

Representa cada mensaje individual dentro de una conversacion.

Guarda:

- `conversationId`
- `vehicleId`
- `senderId`
- `receiverId`
- `text`
- `sentAt`

Esto permite mantener historial completo.

### `Backend-TicoAutoss/controllers/userController.js`

Se encarga del registro.

Hace:

- validar datos basicos
- validar email
- evitar correos repetidos
- hashear la contrasena con `bcryptjs`
- guardar el usuario

### `Backend-TicoAutoss/middleware/auth.js`

Tiene tres partes:

- `authenticateToken`: protege rutas privadas
- `generateToken`: hace login y crea el JWT
- `logout`: invalida tokens anteriores del usuario

### `Backend-TicoAutoss/controllers/vehicleController.js`

Es el controlador principal de publicaciones.

Funciones importantes:

- `vehiclePost`: crea vehiculo
- `vehiclePut`: edita vehiculo
- `vehicleDelete`: elimina vehiculo y limpia conversaciones relacionadas
- `vehicleSold`: marca como vendido
- `vehicleGet`: lista con filtros y paginacion
- `vehicleGetById`: devuelve detalle con datos del propietario

La idea clave es que el filtrado no se hace en frontend; se hace en backend construyendo un objeto de filtros para MongoDB.

### `Backend-TicoAutoss/controllers/messageController.js`

Controla la mensajeria.

Funciones importantes:

- `sendMessageToVehicleOwner`: envia el primer mensaje o continua el hilo
- `getVehicleConversation`: trae el historial del usuario autenticado para ese vehiculo
- `getMyConversations`: conversaciones iniciadas por el interesado
- `getOwnerInbox`: inbox del propietario
- `getConversationById`: abre una conversacion concreta
- `replyToConversation`: responde dentro del hilo

La regla importante es que solo pueden ver esa conversacion las dos personas involucradas.

### `Backend-TicoAutoss/middleware/uploadVehicleImages.js`

Usa `multer` para manejar imagenes.

Se encarga de:

- guardar archivos en disco
- validar tipos permitidos
- limitar cantidad de imagenes
- limitar tamano maximo

### `Backend-TicoAutoss/routes/*.js`

Las rutas solo conectan URL + metodo HTTP con su controlador correspondiente.

Ejemplo:

- `vehicleRoutes.js` conecta los endpoints REST de vehiculos
- `messageRoutes.js` conecta inbox, conversaciones y respuestas
- `authRoutes.js` conecta login, logout y `me`
- `userRoutes.js` conecta registro

## 4. Frontend explicado

### `Frontend-TicoAutos/js/app.js`

Es el archivo base del frontend.

Centraliza:

- manejo de sesion
- utilidades para `fetch`
- formateo de moneda y fecha
- render del menu superior

Practicamente todos los demas archivos usan funciones de aqui.

### `Frontend-TicoAutos/js/index.js`

Controla la pagina principal.

Hace:

- leer filtros desde el formulario
- construir query params
- llamar `GET /api/vehicles`
- pintar la lista de tarjetas
- manejar paginacion
- permitir compartir, editar, eliminar o marcar vendido

### `Frontend-TicoAutos/js/login.js`

Controla la pantalla de login.

Hace:

- validar email y contrasena
- llamar `POST /api/auth/login`
- guardar token y usuario en `localStorage`
- redirigir al inicio

### `Frontend-TicoAutos/js/register.js`

Controla la pantalla de registro.

Hace:

- validar formulario
- llamar `POST /api/users/register`
- guardar el ultimo correo en `sessionStorage`
- redirigir al login

### `Frontend-TicoAutos/js/createVehicle.js`

Controla la publicacion de vehiculos.

Hace:

- validar datos del formulario
- permitir seleccionar varias imagenes
- mostrar vista previa
- enviar `FormData` al backend

### `Frontend-TicoAutos/js/editVehicle.js`

Controla la edicion de vehiculos.

Hace:

- cargar el vehiculo actual
- rellenar el formulario
- mostrar imagenes actuales
- agregar nuevas imagenes si el usuario selecciona mas

### `Frontend-TicoAutos/js/vehicle.js`

Controla la vista de detalle.

Hace:

- cargar datos del vehiculo
- mostrar galeria e informacion grande
- mostrar acciones del propietario
- mostrar el historial de mensajes si el usuario esta autenticado
- enviar mensajes al propietario

Si el usuario es el propietario, el formulario de mensaje no se muestra.

### `Frontend-TicoAutos/js/questions.js`

Aunque el archivo se llama `questions.js`, ahora funciona como centro de mensajes.

Tiene tres funciones visuales:

- mostrar conversaciones iniciadas por el interesado
- mostrar mensajes pendientes del propietario
- abrir el historial de una conversacion y responder

## 5. Relaciones entre entidades

Las relaciones del proyecto quedan asi:

- un `User` puede tener muchos `Vehicle`
- un `Vehicle` puede tener muchas `Conversation`
- una `Conversation` pertenece a un `Vehicle`
- una `Conversation` conecta a dos usuarios:
  - propietario
  - interesado
- una `Conversation` tiene muchos `Message`

## 6. Permisos importantes

### Vehiculos

- solo el usuario autenticado puede crear vehiculos
- solo el propietario puede editar, eliminar o marcar vendido

### Mensajes

- solo usuarios autenticados pueden enviar mensajes
- nadie puede escribirse a si mismo
- solo propietario e interesado pueden ver la conversacion
- el propietario ve mensajes pendientes de sus publicaciones

## 7. Como explicar el proyecto en una defensa

Una forma clara de explicarlo es esta:

1. "Tengo una API REST separada por routes, controllers, models y middleware."
2. "La autenticacion funciona con JWT y middleware de proteccion."
3. "Los vehiculos se consultan con filtros y paginacion reales desde backend."
4. "Cada vehiculo puede tener varias imagenes usando multer."
5. "La mensajeria no depende de roles fijos, sino del contexto entre propietario e interesado."
6. "Cada conversacion se reutiliza por vehiculo para mantener historial."
7. "El frontend consume la API real y maneja el token en localStorage."

## 8. Recomendacion para estudiar el codigo

Si quieres entender el proyecto rapido, revisalo en este orden:

1. `Backend-TicoAutoss/index.js`
2. `Backend-TicoAutoss/routes/`
3. `Backend-TicoAutoss/controllers/`
4. `Backend-TicoAutoss/models/`
5. `Frontend-TicoAutos/js/app.js`
6. `Frontend-TicoAutos/js/index.js`
7. `Frontend-TicoAutos/js/vehicle.js`
8. `Frontend-TicoAutos/js/questions.js`

Con ese recorrido entiendes casi todo el flujo del sistema.
