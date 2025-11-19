# 🔐 Güvenlik Analiz Raporu

**Tarih:** 2025-11-19
**Proje:** NeedOne - Valorant Matchmaking App
**Analiz Kapsamı:** Tüm API endpoint'leri, authentication, authorization, input validation, dependency security

---

## 📋 Özet

| Kategori | Sayı |
|----------|------|
| 🔴 Critical | 1 |
| 🟠 High | 4 |
| 🟡 Medium | 3 |
| ✅ İyi Uygulamalar | 9 |

---

## 🔴 CRITICAL - Acil Düzeltme Gerekli

### 1. Listing Detail Endpoint Authentication Eksikliği

**Dosya:** `app/api/listings/[id]/route.ts`
**Satır:** 8-71

**Sorun:**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // ❌ Authentication kontrolü YOK
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      // ⚠️ Tüm mesajları ve başvuruları dahil ediyor
      messages: { ... },
      applications: { ... }
    }
  })
}
```

**Risk:**
- Herhangi biri herhangi bir listing'in tüm detaylarını görebilir
- Listing sahipleri ve başvuranlar arasındaki özel mesajlar herkese açık
- Başvuru bilgileri (email, profil bilgileri) herkes tarafından erişilebilir
- **GDPR/KVKK ihlali riski**

**Çözüm:**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        include: {
          playerProfile: {
            include: {
              playerAgents: true,
            },
          },
        },
      },
      // ✅ Sadece listing sahibi veya başvuran ise mesajları göster
      applications: {
        where: {
          OR: [
            { listing: { ownerUserId: session.user.id } },
            { applicantUserId: session.user.id }
          ]
        },
        // ... rest
      },
      messages: {
        where: {
          OR: [
            { listing: { ownerUserId: session.user.id } },
            { senderUserId: session.user.id }
          ]
        },
        // ... rest
      },
    },
  })

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  // ✅ Sadece ilgili kişiler detayları görebilir
  const isOwner = listing.ownerUserId === session.user.id
  const hasApplied = listing.applications.some(app => app.applicantUserId === session.user.id)

  if (!isOwner && !hasApplied) {
    // Public view - sadece temel bilgiler
    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        mode: listing.mode,
        region: listing.region,
        // ... sadece public alanlar
      }
    })
  }

  return NextResponse.json({ listing })
}
```

---

## 🟠 HIGH - Önemli Güvenlik Sorunları

### 2. Dependency Güvenlik Açıkları

**Komut:** `npm audit`

**Bulgular:**
```json
{
  "vulnerabilities": {
    "glob": {
      "severity": "high",
      "title": "Command injection via -c/--cmd executes matches with shell:true",
      "url": "https://github.com/advisories/GHSA-5j98-mcp5-4vw2",
      "cvss": 7.5,
      "range": ">=10.2.0 <10.5.0"
    }
  },
  "metadata": {
    "vulnerabilities": {
      "high": 3,
      "total": 3
    }
  }
}
```

**Risk:**
- glob paketi command injection açığı
- eslint-config-next üzerinden gelen indirect dependency
- Development environment'ta risk

**Çözüm:**
```bash
# eslint-config-next'i güncelleyin
npm install eslint-config-next@latest --save-dev

# Veya glob'u direkt güncelleyin
npm install glob@latest --save-dev

# Kontrol edin
npm audit
```

---

### 3. Rate Limiting Eksikliği

**Sorun:**
Tüm API endpoint'lerinde rate limiting yok.

**Risk:**
- **Brute force attacks** (login endpoint'i)
- **DDoS attacks** (tüm endpoint'ler)
- **Spam attacks** (listing oluşturma, mesaj gönderme)
- **Aim trainer score manipulation** (sürekli score gönderimi)

**Çözüm:**

1. **Rate limiting library yükleyin:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

2. **Rate limiter utility oluşturun:**

`lib/rate-limit.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// In-memory rate limiter for development
const cache = new Map()

export const rateLimiter = new Ratelimit({
  redis: process.env.UPSTASH_REDIS_URL
    ? Redis.fromEnv()
    : {
        // Mock Redis for development
        sadd: async () => {},
        eval: async () => {},
      } as any,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
  prefix: "needone",
})

// Specific rate limiters
export const loginRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
  prefix: "needone:login",
})

export const messageRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 messages per minute
  prefix: "needone:message",
})

export const listingRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 listings per hour
  prefix: "needone:listing",
})

export const aimTrainerRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 scores per 10 minutes
  prefix: "needone:aimtrainer",
})
```

3. **Middleware'de uygulayın:**

`middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limit"

export default withAuth(
  async function middleware(req) {
    // Rate limiting for API routes
    if (req.nextUrl.pathname.startsWith("/api")) {
      const ip = req.ip ?? "127.0.0.1"
      const { success, limit, reset, remaining } = await rateLimiter.limit(ip)

      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        })
      }
    }

    return NextResponse.next()
  },
  {
    // ... existing config
  }
)
```

4. **Endpoint-specific rate limiting:**

`app/api/listings/route.ts`:
```typescript
import { listingRateLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ Rate limiting
  const { success } = await listingRateLimiter.limit(session.user.id)

  if (!success) {
    return NextResponse.json(
      { error: "Too many listings created. Please wait before creating another." },
      { status: 429 }
    )
  }

  // ... rest of the code
}
```

---

### 4. Admin Ban Duration Validation Eksikliği

**Dosya:** `app/api/admin/users/[id]/route.ts`
**Satır:** 94-109

**Sorun:**
```typescript
const { isBanned, banDuration, banReason } = body

if (isBanned && banDuration) {
  // ❌ banDuration için max değer kontrolü yok
  updateData.bannedUntil = new Date(
    Date.now() + banDuration * 24 * 60 * 60 * 1000
  )
}
```

**Risk:**
- Admin çok büyük bir sayı gönderebilir (örn: 999999999 gün)
- JavaScript Date overflow
- Database overflow

**Çözüm:**
```typescript
const updateUserSchema = z.object({
  isBanned: z.boolean(),
  banDuration: z.number().int().min(1).max(3650).optional(), // Max 10 yıl
  banReason: z.string().max(500).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // ...
  const body = await req.json()
  const data = updateUserSchema.parse(body) // ✅ Zod validation

  const updateData: any = {
    isBanned: data.isBanned,
  }

  if (data.isBanned && data.banDuration) {
    updateData.bannedUntil = new Date(
      Date.now() + data.banDuration * 24 * 60 * 60 * 1000
    )
    updateData.banReason = data.banReason || "Banned by admin"
  } else if (!data.isBanned) {
    updateData.bannedUntil = null
    updateData.banReason = null
  } else {
    // ✅ Permanent ban
    updateData.bannedUntil = null
    updateData.banReason = data.banReason || "Permanently banned by admin"
  }

  // ...
}
```

---

### 5. Admin Search SQL Injection Risk

**Dosya:** `app/api/admin/users/route.ts`
**Satır:** 35-44

**Sorun:**
```typescript
if (search) {
  where.OR = [
    { email: { contains: search, mode: "insensitive" } },
    {
      playerProfile: {
        nickname: { contains: search, mode: "insensitive" },
      },
    },
  ]
}
```

**Risk:**
- Prisma normalde SQL injection'a karşı korumalı
- Ancak search string sanitize edilmemiş
- Special characters sorun çıkarabilir

**Çözüm:**
```typescript
// Sanitize search input
const sanitizeSearch = (input: string): string => {
  return input
    .replace(/[<>\"']/g, "") // Remove HTML/SQL special chars
    .trim()
    .slice(0, 100) // Max 100 characters
}

const search = searchParams.get("search") || ""
const sanitizedSearch = sanitizeSearch(search)

if (sanitizedSearch) {
  where.OR = [
    { email: { contains: sanitizedSearch, mode: "insensitive" } },
    {
      playerProfile: {
        nickname: { contains: sanitizedSearch, mode: "insensitive" },
      },
    },
  ]
}
```

---

## 🟡 MEDIUM - İyileştirme Gerektiren

### 6. Security Headers Eksikliği

**Sorun:**
Next.js'te security headers yapılandırılmamış.

**Çözüm:**

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

### 7. CORS Yapılandırması

**Sorun:**
CORS policy açıkça tanımlanmamış.

**Çözüm:**

`lib/cors.ts`:
```typescript
import { NextResponse } from "next/server"

export function corsHeaders(origin?: string) {
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
    // Production domain'leri ekleyin
  ]

  const responseOrigin = allowedOrigins.includes(origin || "")
    ? origin
    : allowedOrigins[0]

  return {
    "Access-Control-Allow-Origin": responseOrigin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  }
}
```

Her API route'unda kullanın:
```typescript
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(req.headers.get("origin") || ""),
  })
}
```

---

### 8. Listing GET Endpoint Public Access

**Dosya:** `app/api/listings/route.ts`
**Satır:** 25-145

**Durum:**
Public listing'ler authentication olmadan erişilebilir.

**Değerlendirme:**
- Bu **normal bir davranış olabilir** (public marketplace)
- Ancak **hassas bilgileri filtrelemek** gerekir

**Öneri:**
```typescript
// Public listings için sadece temel bilgiler
const listings = await prisma.listing.findMany({
  where,
  select: {
    id: true,
    title: true,
    mode: true,
    region: true,
    minRank: true,
    maxRank: true,
    desiredRole: true,
    createdAt: true,
    expiresAt: true,
    owner: {
      select: {
        id: true,
        playerProfile: {
          select: {
            nickname: true,
            tagline: true,
            rankCurrent: true,
            reputationScore: true,
            // ❌ Email, personal info dahil etme
          }
        }
      }
    },
    _count: {
      select: {
        applications: true,
      },
    },
    // ❌ messages, applications dahil etme (public için)
  },
  orderBy: { createdAt: "desc" },
  take: 50,
})
```

---

## ✅ İyi Uygulamalar (Tespit Edilen)

### 1. ✅ Authentication - NextAuth.js
- JWT tabanlı session yönetimi
- Ban kontrolü login'de yapılıyor
- Multiple provider desteği (Credentials, Discord)

### 2. ✅ Password Security
- bcryptjs ile hash'leme
- Salt otomatik ekleniyor

### 3. ✅ Input Validation
- Zod schema validation kullanılıyor
- Type-safe API endpoint'leri

### 4. ✅ SQL Injection Koruması
- Prisma ORM kullanımı
- Parameterized queries otomatik

### 5. ✅ Authorization
- Admin endpoint'lerinde isAdmin kontrolü
- Owner kontrolü (listing'leri sadece sahibi silebilir)

### 6. ✅ XSS Koruması
- React otomatik escape ediyor
- dangerouslySetInnerHTML kullanılmamış
- innerHTML kullanımı yok

### 7. ✅ Ban Sistemi
- Temporary ve permanent ban desteği
- Login'de ban kontrolü
- API endpoint'lerinde ban kontrolü (listing create)

### 8. ✅ Block Sistemi
- Kullanıcılar birbirini engelleyebiliyor
- Engellenen kullanıcılara mesaj gönderilemez

### 9. ✅ Environment Variables
- Hassas bilgiler .env'de
- .env.example temiz ve güvenli

---

## 🎯 Öncelik Sırası (Uygulama Planı)

### 🔥 Acil (Bu Hafta)
1. **Listing detail endpoint'ine authentication ekle** (#1)
2. **Dependencies'i güncelle** (#2)

### ⚡ Önemli (Bu Ay)
3. **Rate limiting implementasyonu** (#3)
4. **Admin ban validation** (#4)
5. **Search input sanitization** (#5)

### 📋 İyileştirme (Gelecek Sprint)
6. **Security headers ekle** (#6)
7. **CORS yapılandırması** (#7)
8. **Public listing filtreleme** (#8)

---

## 📝 Ek Öneriler

### 1. Logging & Monitoring
```typescript
// lib/logger.ts
export function logSecurityEvent(event: {
  type: "login_failed" | "unauthorized_access" | "rate_limit_exceeded"
  userId?: string
  ip: string
  details?: any
}) {
  console.error("[SECURITY]", {
    timestamp: new Date().toISOString(),
    ...event
  })

  // Production'da: Send to monitoring service (Sentry, LogRocket, etc.)
}
```

### 2. API Key Support (Gelecek)
WebSocket bağlantıları için API key sistemi:
```typescript
// lib/api-keys.ts
export async function generateApiKey(userId: string) {
  const key = crypto.randomBytes(32).toString("hex")

  await prisma.apiKey.create({
    data: {
      userId,
      key: await bcrypt.hash(key, 10),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    }
  })

  return key
}
```

### 3. Audit Trail (Admin İşlemleri)
```typescript
// Her admin işlemini logla
await prisma.auditLog.create({
  data: {
    adminId: session.user.id,
    action: "USER_BANNED",
    targetUserId: userId,
    details: { reason: banReason, duration: banDuration },
  }
})
```

### 4. Two-Factor Authentication (2FA)
Özellikle admin hesapları için 2FA eklenebilir.

### 5. Email Verification
Yeni kayıtlar için email doğrulama sistemi.

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [NextAuth.js Best Practices](https://next-auth.js.org/getting-started/introduction)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)

---

**Rapor Sonu**
Sorularınız için: GitHub Issues
