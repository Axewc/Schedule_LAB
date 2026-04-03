# Schedule LAB — Sistema de Agendamiento Médico/Dental

Sistema de agendamiento de citas en línea para consultorios médicos y dentales. Construido con **Next.js 16**, **Prisma 7**, **Supabase (PostgreSQL)**, **Stripe** y **Resend**.

---

## Índice

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Requisitos Previos](#3-requisitos-previos)
4. [Configuración de Supabase](#4-configuración-de-supabase)
5. [Configuración de Stripe](#5-configuración-de-stripe)
6. [Configuración de Resend](#6-configuración-de-resend)
7. [Configuración de NextAuth](#7-configuración-de-nextauth)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [Desarrollo Local](#9-desarrollo-local)
10. [Despliegue en Vercel](#10-despliegue-en-vercel)
11. [Cron Jobs en Vercel](#11-cron-jobs-en-vercel)
12. [Migraciones y Seed en Producción](#12-migraciones-y-seed-en-producción)
13. [Arquitectura de Datos](#13-arquitectura-de-datos)
14. [API Reference](#14-api-reference)

---

## 1. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET / USUARIO                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Hosting)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Next.js 16 App Router                     │ │
│  │                                                            │ │
│  │   PÁGINAS PÚBLICAS          ADMIN (protegido)              │ │
│  │   /          Landing        /admin/dashboard               │ │
│  │   /agendar   Booking flow   /admin/appointments            │ │
│  │   /mi-cita   Manage appt    /admin/schedules               │ │
│  │                             /admin/providers               │ │
│  │   API ROUTES                /admin/services                │ │
│  │   /api/providers/*                                         │ │
│  │   /api/appointments/*       CRON JOBS                      │ │
│  │   /api/webhooks/stripe      /api/cron/expire-locks (1min)  │ │
│  │   /api/auth/[...nextauth]   /api/cron/send-reminders (1h)  │ │
│  └────────────────────┬───────────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────────────┘
                        │
          ┌─────────────┼──────────────┬──────────────┐
          ▼             ▼              ▼              ▼
  ┌──────────────┐ ┌─────────┐ ┌──────────────┐ ┌─────────┐
  │  SUPABASE    │ │ STRIPE  │ │   RESEND     │ │NEXTAUTH │
  │ (PostgreSQL) │ │(Pagos)  │ │  (Emails)    │ │  (Auth) │
  │              │ │         │ │              │ │         │
  │ Pooler URL   │ │Payment  │ │ React Email  │ │  JWT    │
  │ (runtime)    │ │Intents  │ │  templates   │ │sessions │
  │ Direct URL   │ │Webhooks │ │ 3K/mes free  │ │         │
  │ (migrations) │ │         │ │              │ │         │
  └──────────────┘ └─────────┘ └──────────────┘ └─────────┘
```

### Flujo de una Cita

```
Paciente → /agendar
  │
  ├─ 1. GET /api/providers                    (listar doctores)
  ├─ 2. GET /api/providers/:id/services       (listar servicios)
  ├─ 3. GET /api/providers/:id/availability   (slots disponibles)
  ├─ 4. POST /api/appointments                (pre-reserva, TTL 15min)
  ├─ 5. POST /api/appointments/pay            (crear Stripe PaymentIntent)
  ├─ 6. [Cliente paga con Stripe Elements]
  └─ 7. POST /api/webhooks/stripe             (Stripe notifica pago OK)
              │
              ├─ Marca cita CONFIRMED
              ├─ Envía email paciente (Resend)
              └─ Envía email doctor (Resend)
```

---

## 2. Estructura del Proyecto

```
schedule-lab/
├── prisma/
│   ├── schema.prisma        # Modelos de datos
│   ├── seed.ts              # Datos iniciales
│   └── migrations/          # Migraciones SQL (generadas por Prisma)
├── prisma.config.ts         # Config de Prisma 7 (URL para migraciones)
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── agendar/page.tsx            # Wizard de agendamiento
│   │   ├── mi-cita/page.tsx            # Gestión de citas
│   │   ├── admin/                      # Panel de administración
│   │   │   ├── layout.tsx              # Protección de rutas admin
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── schedules/page.tsx
│   │   │   ├── providers/page.tsx
│   │   │   └── services/page.tsx
│   │   └── api/
│   │       ├── providers/              # Endpoints públicos
│   │       ├── appointments/           # Endpoints públicos
│   │       ├── webhooks/stripe/        # Webhook de Stripe
│   │       ├── cron/                   # Tareas programadas
│   │       ├── auth/[...nextauth]/     # Auth handler
│   │       └── admin/                  # Endpoints protegidos
│   ├── components/
│   │   ├── ui/                         # Button, Card, Input, etc.
│   │   └── admin/admin-nav.tsx
│   ├── emails/templates.tsx            # Plantillas de email (React Email)
│   └── lib/
│       ├── prisma.ts        # Cliente Prisma (singleton con pg adapter)
│       ├── auth.ts          # NextAuth configuration
│       ├── email.ts         # Funciones de envío de emails
│       ├── stripe.ts        # Cliente Stripe
│       ├── resend.ts        # Cliente Resend
│       ├── validations.ts   # Zod schemas
│       └── utils.ts         # Utilidades (formato, generación de código)
├── vercel.json              # Cron jobs y configuración Vercel
└── .env.example             # Variables de entorno documentadas
```

---

## 3. Requisitos Previos

| Herramienta | Versión mínima | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| npm | 10+ | Gestor de paquetes |
| Cuenta Supabase | — | Base de datos PostgreSQL |
| Cuenta Vercel | — | Hosting y cron jobs |
| Cuenta Stripe | — | Procesamiento de pagos |
| Cuenta Resend | — | Emails transaccionales |

---

## 4. Configuración de Supabase

### 4.1 Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige nombre, contraseña de base de datos y región (preferiblemente `us-east-1` o la más cercana a tus usuarios)
3. Espera ~2 minutos a que el proyecto inicie

### 4.2 Obtener las URLs de conexión

Supabase expone **dos** URLs que necesitas:

**URL de Pooler (para el servidor Next.js en producción):**
> Settings → Database → Connection Pooling

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Esta URL usa **Transaction Pooling (PgBouncer)** para manejar miles de conexiones concurrentes en un entorno serverless como Vercel. Úsala en `DATABASE_URL`.

**URL directa (para migraciones de Prisma):**
> Settings → Database → Connection string → URI

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Esta URL establece una conexión directa a PostgreSQL, necesaria para `prisma migrate deploy`. Úsala en `DIRECT_URL`.

### 4.3 Habilitar Row Level Security (RLS)

> [!NOTE]
> El sistema usa Prisma con las credenciales del servidor (service role), por lo que RLS **no aplica** a las queries de la aplicación. Sin embargo, es buena práctica habilitarlo para proteger acceso directo desde el cliente.

En Supabase → SQL Editor, ejecuta:

```sql
-- RLS está habilitado por defecto en tablas nuevas creadas por Supabase.
-- Prisma crea tablas directamente, así que necesitas habilitarlo manualmente
-- si planeas usar Row Level Security en el futuro:

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ... (resto de tablas)
```

### 4.4 Configurar SSL

La URL de Supabase ya incluye SSL por defecto. No se requiere configuración adicional.

---

## 5. Configuración de Stripe

### 5.1 Obtener las llaves

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys**
2. Copia la **Publishable key** (`pk_test_...`) y **Secret key** (`sk_test_...`)
3. Para producción, usa las llaves del modo **Live** (`pk_live_...`, `sk_live_...`)

### 5.2 Configurar el Webhook

El webhook es **esencial**: confirma el pago y activa el envío de emails.

**En desarrollo (usando Stripe CLI):**

```bash
# Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# Copia el webhook secret que muestra: whsec_...
```

**En producción (Vercel):**

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL del endpoint: `https://tu-dominio.vercel.app/api/webhooks/stripe`
3. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copia el **Signing secret** (`whsec_...`) → va en `STRIPE_WEBHOOK_SECRET`

### 5.3 Integrar Stripe Elements (Formulario de Pago)

El `src/app/agendar/page.tsx` en el Paso 4 tiene un placeholder del formulario de Stripe. Para producción, reemplaza el bloque del placeholder con el componente `PaymentElement` de `@stripe/react-stripe-js`:

```tsx
// Instalar: npm install @stripe/react-stripe-js @stripe/stripe-js
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Envolver el paso 4 con:
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <StripePaymentForm onSuccess={() => setStep(5)} />
</Elements>
```

---

## 6. Configuración de Resend

### 6.1 Obtener el API Key

1. Ve a [resend.com](https://resend.com) → **API Keys → Create API Key**
2. Copia la clave (`re_...`) → va en `RESEND_API_KEY`

### 6.2 Verificar tu Dominio (requerido para producción)

> Sin dominio verificado, los emails solo se pueden enviar a la dirección con la que te registraste en Resend.

1. Resend Dashboard → **Domains → Add Domain**
2. Ingresa tu dominio (ej. `consultorio.com`)
3. Agrega los registros DNS que te indica Resend (SPF, DKIM, DMARC) en tu proveedor de dominio
4. Espera la verificación (generalmente < 24h)
5. Actualiza `FROM_EMAIL` a `Consultorio Dr. García <citas@consultorio.com>`

---

## 7. Configuración de NextAuth

### 7.1 Generar AUTH_SECRET

```bash
# Opción 1: OpenSSL (recomendado)
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copia el resultado y úsalo en `AUTH_SECRET`. Este valor debe tener al menos 32 caracteres y debe ser único por entorno (development ≠ production).

---

## 8. Variables de Entorno

Copia `.env.example` a `.env.local` para desarrollo:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL Pooler de Supabase (runtime) | `postgresql://postgres.xxx:pass@pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | URL directa de Supabase (migraciones) | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `STRIPE_SECRET_KEY` | Llave secreta de Stripe | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Llave pública de Stripe (cliente) | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe | `whsec_...` |
| `RESEND_API_KEY` | API key de Resend | `re_...` |
| `FROM_EMAIL` | Dirección remitente de emails | `Consultorio <citas@tu-dominio.com>` |
| `DOCTOR_EMAIL` | Email del doctor para notificaciones | `dr@tu-dominio.com` |
| `CLINIC_ADDRESS` | Dirección del consultorio para emails | `Av. Insurgentes 1234, CDMX` |
| `MAPS_URL` | Enlace de Google Maps para recordatorios | `https://maps.google.com/?q=...` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación | `https://tu-app.vercel.app` |
| `AUTH_SECRET` | Secret para JWT de NextAuth (≥32 chars) | `base64-string-de-32-chars` |
| `CRON_SECRET` | Secret para proteger endpoints de cron | `cualquier-string-secreto` |

---

## 9. Desarrollo Local

### 9.1 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Axewc/Schedule_LAB.git
cd Schedule_LAB

# 2. Instalar dependencias (también ejecuta prisma generate via postinstall)
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales
```

### 9.2 Crear las tablas en Supabase

```bash
# Opción A (recomendado en desarrollo): push directo sin crear archivos de migración
npm run db:push

# Opción B (recomendado en producción): crear migration y aplicarla
npm run db:migrate
# Responde al prompt: nombre de la migración (ej: "initial_schema")
```

### 9.3 Cargar datos iniciales

```bash
npm run db:seed
# Crea:
#   - 1 prestador: Dr. Alejandro García
#   - 5 servicios con precios y anticipos
#   - Horarios Lun-Sáb
#   - Admin: admin@consultorio.com / admin123
```

### 9.4 Iniciar servidor de desarrollo

```bash
npm run dev
# → http://localhost:3000
```

### 9.5 Probar el webhook de Stripe localmente

```bash
# En otra terminal:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

---

## 10. Despliegue en Vercel

### 10.1 Importar el proyecto

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de GitHub `Axewc/Schedule_LAB`
3. Framework: **Next.js** (detectado automáticamente)
4. Root Directory: `.` (raíz del repositorio)

### 10.2 Configurar Variables de Entorno en Vercel

En el panel de configuración del proyecto de Vercel, **antes de hacer el primer deploy**, agrega todas las variables del archivo `.env.example` con sus valores de producción.

> **Ruta:** Project → Settings → Environment Variables

Variables críticas a configurar:

| Variable | Entorno |
| --- | --- |
| `DATABASE_URL` | Production, Preview, Development |
| `DIRECT_URL` | Production, Preview, Development |
| `AUTH_SECRET` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | Production (live), Preview (test) |
| `STRIPE_WEBHOOK_SECRET` | Production, Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production (live), Preview (test) |
| `RESEND_API_KEY` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Production: tu dominio real |
| `CRON_SECRET` | Production, Preview |

> [!IMPORTANT]
> `NEXT_PUBLIC_APP_URL` en producción debe ser la URL real de Vercel o tu dominio personalizado (ej. `https://consultorio.com`). Esto afecta los enlaces dentro de los emails de confirmación.

### 10.3 Primer Deploy

Una vez configuradas las variables, haz click en **Deploy**. El proceso:

1. Instala dependencias (`npm install` → ejecuta `prisma generate` vía `postinstall`)
2. Compila el proyecto (`prisma generate && next build`)
3. Despliega las funciones serverless

### 10.4 Ejecutar migraciones en producción

Las migraciones **no se ejecutan automáticamente**. Debes ejecutarlas manualmente:

```bash
# Opción A: Desde tu máquina local apuntando a la DB de producción
DIRECT_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres" \
npx prisma migrate deploy

# Opción B: Desde el terminal de Supabase (SQL Editor)
# Aplica manualmente el SQL de prisma/migrations/*/migration.sql
```

### 10.5 Ejecutar el seed en producción

```bash
# Desde tu máquina local, apuntando a la DB de producción
DATABASE_URL="postgresql://postgres.xxx:pass@pooler.supabase.com:6543/postgres" \
npm run db:seed
```

### 10.6 Configurar dominio personalizado (opcional)

1. Vercel → Project → Settings → Domains
2. Agrega tu dominio (ej. `consultorio.com`)
3. Configura los registros DNS que indica Vercel en tu registrador

---

## 11. Cron Jobs en Vercel

Los cron jobs se configuran en `vercel.json`. El plan **Hobby** de Vercel permite **una ejecución diaria**; para mayor frecuencia se necesita el plan **Pro**.

| Job | Path | Frecuencia | Descripción |
|---|---|---|---|
| Expirar slots | `/api/cron/expire-locks` | Cada 1 min (`* * * * *`) | Libera pre-reservas sin pago |
| Recordatorios | `/api/cron/send-reminders` | Cada hora (`0 * * * *`) | Emails 24h antes de la cita |

> [!NOTE]
> Con el plan **Hobby** de Vercel, el cron más frecuente posible es `"0 0 * * *"` (una vez al día). Para el cron de expiración de slots (cada minuto), necesitas el **plan Pro** o una alternativa como [cron-job.org](https://cron-job.org) (gratuito) que llame al endpoint con el `CRON_SECRET` en el header `Authorization: Bearer`.

Los endpoints de cron están protegidos: requieren el header `Authorization: Bearer {CRON_SECRET}`. Vercel inyecta este header automáticamente usando la variable `CRON_SECRET`.

---

## 12. Migraciones y Seed en Producción

### Flujo de trabajo de migraciones

```
Desarrollo local                 Producción (Supabase)
─────────────────               ─────────────────────────
npm run db:migrate               npx prisma migrate deploy
(crea migration files)           (aplica migrations existentes)
       │                                    │
       ▼                                    ▼
prisma/migrations/               Tablas actualizadas
  YYYYMMDD_nombre/               en Supabase
  migration.sql
```

### Comandos disponibles

```bash
npm run db:push        # Sync schema → DB sin crear migration files (solo desarrollo)
npm run db:migrate     # Crea y aplica migration (desarrollo → genera archivos)
npm run db:seed        # Carga datos iniciales
npm run db:studio      # Abre Prisma Studio (UI para explorar la DB)
```

### Prisma 7 y Supabase: Notas importantes

Prisma 7 usa un **driver adapter** en lugar de un engine binario. Esto tiene implicaciones:

- **Runtime (`src/lib/prisma.ts`):** Usa `DATABASE_URL` (URL del pooler de Supabase) con `@prisma/adapter-pg`
- **Migraciones (`prisma.config.ts`):** Usa `DIRECT_URL` (URL directa de Supabase) para evitar problemas de PgBouncer con transacciones de migración

El `prisma.config.ts` ya está configurado para leer `DIRECT_URL`:

```ts
// prisma.config.ts
datasource: {
  url: process.env["DIRECT_URL"],  // URL directa para migraciones
}
```

Y el cliente en runtime usa la URL pooler:

```ts
// src/lib/prisma.ts
const connectionString = process.env.DATABASE_URL!; // URL pooler para queries
const adapter = new PrismaPg({ connectionString });
```

---

## 13. Arquitectura de Datos

```
Provider ──< Service ──< Appointment >── Payment
    │                        │
    ├──< Schedule             └──< EmailLog
    └──< BlockedDate

AdminUser (independiente, vinculable a Provider)
```

### Lógica de Slot Locking

```
1. Paciente selecciona slot → POST /api/appointments
   → status = PENDING_PAYMENT
   → lockedUntil = NOW() + 15 minutos

2. Slot aparece como NO DISPONIBLE para otros usuarios
   (query filtra por status IN [CONFIRMED, PENDING_PAYMENT] AND lockedUntil > NOW())

3a. Pago exitoso → Stripe webhook
   → status = CONFIRMED
   → lockedUntil = NULL

3b. Pago fallido o timeout → Cron job (cada 1 min)
   → Busca: status = PENDING_PAYMENT AND lockedUntil < NOW()
   → status = EXPIRED
   → Slot queda disponible
```

---

## 14. API Reference

### Endpoints Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/providers` | Lista prestadores activos |
| `GET` | `/api/providers/:id/services` | Servicios de un prestador |
| `GET` | `/api/providers/:id/availability?date=YYYY-MM-DD&serviceId=xxx` | Slots disponibles |
| `POST` | `/api/appointments` | Crear pre-reserva (body: `CreateAppointmentInput`) |
| `POST` | `/api/appointments/pay` | Crear Stripe PaymentIntent (body: `{ appointmentId }`) |
| `GET` | `/api/appointments/lookup?code=CIT-XXXXX` o `?email=xxx` | Buscar cita |
| `PATCH` | `/api/appointments/:code/cancel` | Cancelar cita |

### Webhooks

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/webhooks/stripe` | Recibe eventos de Stripe (requiere `Stripe-Signature` header) |

### Endpoints Admin (requieren sesión JWT)

| Método | Ruta | Descripción |
|---|---|---|
| `GET/POST` | `/api/admin/appointments` | Listar / actualizar citas |
| `PATCH` | `/api/admin/appointments/:id` | Actualizar estado de cita |
| `GET` | `/api/admin/dashboard` | Métricas del dashboard |
| `GET/POST` | `/api/admin/providers` | Gestión de prestadores |
| `PUT/DELETE` | `/api/admin/providers/:id` | Editar / desactivar prestador |
| `GET/POST` | `/api/admin/services` | Gestión de servicios |
| `PUT/DELETE` | `/api/admin/services/:id` | Editar / desactivar servicio |
| `GET/POST` | `/api/admin/schedules` | Gestión de horarios |
| `PUT/DELETE` | `/api/admin/schedules/:id` | Editar / eliminar horario |
| `GET/POST` | `/api/admin/blocked-dates` | Gestión de fechas bloqueadas |
| `DELETE` | `/api/admin/blocked-dates/:id` | Eliminar fecha bloqueada |

### Cron Jobs (requieren `Authorization: Bearer {CRON_SECRET}`)

| Método | Ruta | Frecuencia |
|---|---|---|
| `POST` | `/api/cron/expire-locks` | Cada 1 minuto |
| `POST` | `/api/cron/send-reminders` | Cada hora |

---

## Licencia

MIT
