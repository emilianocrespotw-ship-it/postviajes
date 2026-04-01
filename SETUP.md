# PostViajes – Cómo correrlo localmente y deployarlo

## Requisitos previos

- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com) (gratis)
- API key de [Anthropic](https://console.anthropic.com/) (Claude)
- API key de [Pexels](https://www.pexels.com/api/) (gratis)
- App de Facebook en [Meta Developers](https://developers.facebook.com/)

---

## 1. Instalación local

```bash
# Clonar o descomprimir el proyecto
cd postviajes

# Instalar dependencias
npm install

# Copiar el archivo de variables de entorno
cp .env.example .env.local
```

---

## 2. Completar el `.env.local`

Editá el archivo `.env.local` con tus credenciales.

### Supabase
1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Copiá la URL y las API keys desde Settings → API
3. En el SQL Editor, ejecutá el contenido de `supabase/schema.sql`

### Anthropic (Claude)
1. Entrá a [console.anthropic.com](https://console.anthropic.com)
2. Creá una API key y pegala en `ANTHROPIC_API_KEY`

### Pexels
1. Registrate en [pexels.com/api](https://www.pexels.com/api/)
2. Pegá el API key en `PEXELS_API_KEY`

### Facebook / Meta
1. Creá una app en [developers.facebook.com](https://developers.facebook.com)
2. Activá los productos: **Facebook Login** e **Instagram Basic Display**
3. Agregá como Redirect URI: `http://localhost:3000/api/auth/callback/facebook`
4. Copiá App ID y App Secret

### NextAuth
```bash
# Generar un secreto aleatorio
openssl rand -base64 32
```
Pegá el resultado en `NEXTAUTH_SECRET`.

---

## 3. Correr localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## 4. Deployar en Vercel (recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Agregar las variables de entorno en Vercel
vercel env add ANTHROPIC_API_KEY
vercel env add PEXELS_API_KEY
# ... y así con cada variable
```

O usá el dashboard de Vercel en [vercel.com](https://vercel.com):
1. Importá el repositorio desde GitHub
2. En Settings → Environment Variables, agregá todas las variables del `.env.example`
3. Deploy automático en cada push a main

---

## 5. Configurar el dominio en Facebook

Una vez deployado, actualizá en tu App de Facebook:
- Redirect URIs válidos: `https://tu-dominio.com/api/auth/callback/facebook`
- App Domains: `tu-dominio.com`

---

## Estructura del proyecto

```
postviajes/
├── app/
│   ├── page.tsx                 ← Landing page
│   ├── login/page.tsx           ← Login con Facebook
│   ├── dashboard/page.tsx       ← Panel de posts
│   ├── new-post/page.tsx        ← Flujo de creación (5 pasos)
│   └── api/
│       ├── auth/[...nextauth]/  ← Autenticación Facebook
│       ├── process-flyer/       ← Leer flyer con Claude IA
│       ├── suggest-images/      ← Buscar fotos en Pexels
│       └── publish/             ← Publicar en FB e Instagram
├── lib/
│   └── supabase.ts              ← Cliente de Supabase
├── supabase/
│   └── schema.sql               ← Estructura de la base de datos
└── .env.example                 ← Variables de entorno
```

---

## Flujo técnico

```
Usuario sube flyer
    ↓
/api/process-flyer (Claude lee la imagen)
    ↓
Retorna: destino, precio, fechas, texto FB, texto IG
    ↓
/api/suggest-images (Pexels busca 10 fotos)
    ↓
Usuario elige imagen + estilo
    ↓
/api/publish (Facebook Graph API)
    ↓
Publica en FB Page + Instagram Business
```
