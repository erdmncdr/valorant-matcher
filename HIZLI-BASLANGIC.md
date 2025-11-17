# 🚀 Hızlı Başlangıç - NeedOne

5 dakikada uygulamayı çalıştırın!

## ⚡ Önkoşullar

Bilgisayarınızda bunlar yüklü olmalı:
- ✅ Node.js (v18+)
- ✅ Docker Desktop (veya PostgreSQL)
- ✅ Git

Yoksa → [Detaylı Kurulum Rehberi](./KURULUM.md)

---

## 🎯 Adım Adım Kurulum

### 1️⃣ Projeyi İndir (1 dakika)

```bash
# Projeyi clone et
git clone https://github.com/kullanici-adi/valorant-matcher.git
cd valorant-matcher

# Doğru branch'e geç
git checkout claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
```

### 2️⃣ Veritabanını Başlat (1 dakika)

**Docker ile (Önerilir):**
```bash
docker run --name needone-postgres \
  -e POSTGRES_PASSWORD=needone2024 \
  -e POSTGRES_DB=needone \
  -p 5432:5432 \
  -d postgres:15
```

**Windows PowerShell:**
```powershell
docker run --name needone-postgres `
  -e POSTGRES_PASSWORD=needone2024 `
  -e POSTGRES_DB=needone `
  -p 5432:5432 `
  -d postgres:15
```

### 3️⃣ Environment Setup (1 dakika)

```bash
# .env dosyası oluştur
cp .env.example .env   # macOS/Linux
copy .env.example .env  # Windows
```

**.env dosyasını aç ve düzenle:**
```env
DATABASE_URL="postgresql://postgres:needone2024@localhost:5432/needone"
NEXTAUTH_SECRET="sizin-gizli-anahtariniz-buraya"
NEXTAUTH_URL="http://localhost:3000"
```

**NEXTAUTH_SECRET oluştur:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Çıktıyı kopyala → `.env` dosyasındaki `NEXTAUTH_SECRET` yerine yapıştır.

### 4️⃣ Bağımlılıkları Yükle (2 dakika)

```bash
npm install
```

### 5️⃣ Veritabanını Hazırla (30 saniye)

```bash
# Prisma client oluştur
npm run db:generate

# Veritabanı şemasını uygula
npm run db:push

# Örnek verileri yükle
npm run db:seed
```

### 6️⃣ Uygulamayı Başlat (10 saniye)

```bash
npm run dev
```

**Tarayıcıda aç:** http://localhost:3000

---

## 🎮 İlk Giriş

### Test Hesapları (Seed sonrası)

Tüm hesapların şifresi: **password123**

| Email | Rol | Açıklama |
|-------|-----|----------|
| `admin@needone.gg` | Admin | Tüm yetkilere sahip |
| `captain@needone.gg` | Team Captain | Takım lideri |
| `duelist@needone.gg` | Solo | Duelist main |
| `controller@needone.gg` | Solo | Controller main |
| `initiator@needone.gg` | Solo | Initiator main |

### Örnek Kullanım Akışı

1. **Giriş Yap:** http://localhost:3000/login
   - Email: `admin@needone.gg`
   - Password: `password123`

2. **Dashboard'u İncele:** Ana sayfa açılacak

3. **Listing Oluştur:**
   - "Create Listing" tıkla
   - Team veya Solo seç
   - Formu doldur
   - Oluştur!

4. **Listing'lere Bak:**
   - "Browse Listings" tıkla
   - Filtreleri kullan
   - Bir listing'e tıkla

5. **Chat Yap:**
   - Listing detayında chat bölümü var
   - Mesaj yaz ve gönder

---

## 🛠️ Sık Kullanılan Komutlar

```bash
# Geliştirme modunda çalıştır
npm run dev

# Veritabanını temizle ve yeniden oluştur
npm run db:push -- --force-reset
npm run db:seed

# Veritabanını görsel olarak incele
npm run db:studio

# Build et (production için)
npm run build
npm start

# Linting
npm run lint
```

---

## 📂 Proje Yapısı

```
valorant-matcher/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, Register
│   ├── (main)/            # Ana sayfalar
│   │   ├── dashboard/     # Dashboard
│   │   ├── listings/      # Listings (browse, create, detail)
│   │   ├── my-listings/   # Kullanıcı listings
│   │   └── admin/         # Admin panel
│   ├── api/               # API routes
│   └── profile/           # Profil sayfaları
├── components/            # React componentler
│   ├── ui/               # UI componentleri
│   ├── listings/         # Listing componentleri
│   └── profile/          # Profil componentleri
├── lib/                   # Yardımcı fonksiyonlar
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── constants.ts      # Sabitler
│   └── utils.ts          # Utility fonksiyonlar
├── prisma/               # Veritabanı
│   ├── schema.prisma     # Veritabanı şeması
│   └── seed.ts           # Seed script
└── public/               # Statik dosyalar
```

---

## 🔥 Özellikler

✅ **Kimlik Doğrulama**
- Email/şifre ile kayıt
- Discord OAuth login
- Güvenli session yönetimi

✅ **Profil Sistemi**
- Detaylı Valorant profili
- Rank, rol, agent seçimi
- Dil ve tercihler

✅ **Listing Sistemi**
- Team listings (4-stack arayanlar)
- Solo listings (bireysel oyuncular)
- Otomatik expiry sistemi
- Filtreler ve arama

✅ **Sosyal Özellikler**
- Gerçek zamanlı chat
- Application sistemi
- Değerlendirme sistemi
- Report & block

✅ **Moderasyon**
- Admin paneli
- Report yönetimi
- Ban sistemi

---

## 🐛 Sorun mu Yaşıyorsunuz?

### Port 3000 kullanımda
```bash
PORT=3001 npm run dev
```

### Veritabanı bağlanamıyor
```bash
# Docker container'ı kontrol et
docker ps

# Çalışmıyorsa başlat
docker start needone-postgres
```

### Prisma hatası
```bash
npm run db:generate
```

### Tüm verileri sıfırla
```bash
npm run db:push -- --force-reset
npm run db:seed
```

Daha fazla yardım için: [KURULUM.md](./KURULUM.md#12-sorun-giderme)

---

## 📖 Dokümantasyon

- 📘 [Detaylı Kurulum Rehberi](./KURULUM.md) - Tüm detaylar
- 📗 [README](./README.md) - Genel bilgiler
- 📙 [ARCHITECTURE](./ARCHITECTURE.md) - Teknik mimari

---

## 🎉 Hazırsınız!

Uygulamanız çalışıyor! Şimdi şunları deneyebilirsiniz:

1. ✅ Farklı test hesaplarıyla giriş yapın
2. ✅ Listing oluşturun
3. ✅ Chat sistemini test edin
4. ✅ Filtreleri kullanın
5. ✅ Admin paneline bakın (admin hesabıyla)

**İyi eğlenceler! 🎮**

---

## 💡 İpuçları

- **Prisma Studio** ile veritabanını görsel olarak inceleyebilirsiniz
- **Seed** komutunu her zaman çalıştırabilirsiniz (data ekler)
- **Admin hesabı** ile tüm özellikleri test edebilirsiniz
- **Discord OAuth** kurmak opsiyoneldir, seed hesapları yeterlidir

---

Sorunuz mu var? [GitHub Issues](https://github.com/kullanici-adi/valorant-matcher/issues) açın!
