# Mantek ERP SaaS

Base comercial para un ERP de mantenimiento multiempresa construido con React, Vite y Firebase. La aplicación conserva los módulos operativos originales —dashboard, equipos, órdenes de trabajo, solicitudes, checklists, planes de mantenimiento, usuarios, reportes y evidencias— y los reorganiza en una arquitectura modular preparada para SaaS.

## Tecnologías

- React 18 + Vite.
- Firebase Authentication para inicio de sesión, cierre de sesión, recuperación y persistencia.
- Cloud Firestore con datos por empresa y documentos individuales por entidad.
- Firebase Storage para evidencias, fotografías y firmas.
- Tailwind CSS para UI profesional simple.
- Generador PDF cliente sin credenciales embebidas.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

Configura Firebase desde `.env` usando las claves públicas del proyecto web:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

No hay credenciales ni contraseñas hardcodeadas en el frontend. Los usuarios se autentican únicamente con Firebase Authentication.

## Configuración Firebase

1. Crea un proyecto Firebase.
2. Habilita **Authentication > Email/password**.
3. Crea usuarios reales desde Firebase Console o un backend con Admin SDK.
4. Crea el perfil del usuario en Firestore:

```text
companies/{companyId}/users/{userId}
```

Campos mínimos:

```json
{
  "uid": "firebase-auth-uid",
  "name": "Nombre Apellido",
  "email": "usuario@empresa.com",
  "role": "admin_empresa",
  "companyId": "empresa-demo",
  "terminal": "Terminal 1",
  "active": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "lastLoginAt": "serverTimestamp"
}
```

5. Publica `firestore.rules` para restringir acceso por autenticación, empresa y rol.
6. Configura reglas de Storage equivalentes para rutas `companies/{companyId}/...` antes de producción.

## Estructura de carpetas

```text
src/
  components/
    common/
    layout/
    forms/
    tables/
    modals/
  pages/
  modules/
    auth/
    equipment/
    workOrders/
    requests/
    checklists/
    maintenancePlans/
    users/
    reports/
  services/
    firebase.js
    authService.js
    firestoreService.js
    storageService.js
    auditService.js
  hooks/
    useAuth.js
    useFirestoreCollection.js
    usePermissions.js
  utils/
    constants.js
    dates.js
    errorHandler.js
    formatters.js
    validators.js
```

`src/App.jsx` queda como proveedor de contexto, protección de sesión, layout y navegación entre páginas.

## Modelo multiempresa

Todas las entidades operativas viven bajo la empresa autenticada:

```text
companies/{companyId}/equipment/{equipmentId}
companies/{companyId}/workOrders/{workOrderId}
companies/{companyId}/requests/{requestId}
companies/{companyId}/checklists/{checklistId}
companies/{companyId}/maintenancePlans/{planId}
companies/{companyId}/spareParts/{partId}
companies/{companyId}/auditLogs/{logId}
companies/{companyId}/settings/general
companies/{companyId}/counters/{counterName}
```

No se guardan arrays completos dentro de un único documento. Cada equipo, OT, solicitud, checklist, plan y repuesto es un documento individual.

## Roles iniciales

- `superadmin`
- `admin_empresa`
- `supervisor`
- `operaciones`
- `mecanico`
- `operador`
- `cliente_lectura`

La pantalla de usuarios administra perfiles Firestore y permite asignar roles `operador` y `mecanico`. La creación de credenciales se mantiene fuera del frontend por seguridad.

## Permisos

La matriz centralizada está en `src/utils/constants.js` y el hook `usePermissions()` expone:

- `can(permission)`
- `canAny(permissions)`
- `canAll(permissions)`

Los permisos se usan en navegación, UI y acciones de escritura. Las reglas Firestore aplican una segunda barrera real del lado servidor.

## Folios concurrentes

`generateFolio(companyId, prefix)` usa transacciones Firestore sobre:

```text
companies/{companyId}/counters/{prefix-year}
```

Formatos soportados:

- `OT-2026-000001`
- `SOL-2026-000001`
- `CHK-2026-000001`
- `PM-2026-000001`

## Evidencias y firmas

Las imágenes y firmas deben subirse a Firebase Storage con `storageService.js`. Firestore guarda únicamente metadatos:

- `url`
- `path`
- `uploadedBy`
- `uploadedAt`
- `fileName`
- `fileType`

Esto evita documentos grandes y costos innecesarios en Firestore.

## Auditoría

`auditService.js` registra creación, edición, eliminación y cambios de estado en:

```text
companies/{companyId}/auditLogs
```

Campos: `action`, `entityType`, `entityId`, `userId`, `userName`, `before`, `after`, `createdAt`.

## Reportes

El módulo de reportes genera PDFs descargables para:

- OT individual.
- Checklist.
- Mensual de mantenimiento.
- Disponibilidad.
- Costos por equipo.
- Daños operacionales.

Cada reporte incluye empresa, fecha, responsable, indicadores, código de validación y pie de página. Para una versión enterprise se recomienda reemplazar el generador liviano por `jspdf`, `pdfmake` o `@react-pdf/renderer` si la política del registro npm lo permite.

## Deploy

```bash
npm run build
```

Publica la carpeta `dist/` en Netlify, Firebase Hosting u otro hosting estático. Configura las variables `VITE_FIREBASE_*` en el proveedor de deploy.

## Próximas mejoras

- Backend Admin SDK para alta de usuarios con custom claims `companyId`/`companies`.
- Reglas de Firebase Storage listas para producción.
- Migrador de datos legacy desde documentos con arrays hacia subcolecciones.
- Reportes PDF con logo embebido, QR real y plantillas corporativas avanzadas.
- Pruebas automatizadas e integración continua.
