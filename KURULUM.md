# NeedOne - Detaylı Kurulum Rehberi 🚀

Bu rehber, NeedOne Valorant matchmaking uygulamasını sıfırdan kurmak için gereken tüm adımları detaylı olarak açıklar.

## 📋 İçindekiler

1. [Sistem Gereksinimleri](#1-sistem-gereksinimleri)
2. [Ön Hazırlık](#2-ön-hazırlık)
3. [Projeyi İndirme](#3-projeyi-indirme)
4. [Veritabanı Kurulumu](#4-veritabanı-kurulumu)
5. [Ortam Değişkenlerini Ayarlama](#5-ortam-değişkenlerini-ayarlama)
6. [Bağımlılıkları Yükleme](#6-bağımlılıkları-yükleme)
7. [Veritabanını Başlatma](#7-veritabanını-başlatma)
8. [Uygulamayı Çalıştırma](#8-uygulamayı-çalıştırma)
9. [İlk Kullanım](#9-ilk-kullanım)
10. [Discord OAuth Kurulumu (Opsiyonel)](#10-discord-oauth-kurulumu-opsiyonel)
11. [Production Deployment](#11-production-deployment)
12. [Sorun Giderme](#12-sorun-giderme)

---

## 1. Sistem Gereksinimleri

### Minimum Gereksinimler:
- **İşletim Sistemi:** Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **Node.js:** v18.0.0 veya üzeri
- **RAM:** 4 GB (Önerilen: 8 GB)
- **Disk:** 500 MB boş alan
- **İnternet:** Stabil internet bağlantısı

### Gerekli Yazılımlar:
- ✅ Node.js ve npm
- ✅ PostgreSQL (veya Docker)
- ✅ Git
- ✅ Bir kod editörü (VS Code önerilir)

---

## 2. Ön Hazırlık

### 2.1. Node.js Kurulumu

#### Windows:
1. [Node.js indirme sayfasına](https://nodejs.org/) gidin
2. **LTS** (Long Term Support) sürümünü indirin
3. İndirilen `.msi` dosyasını çalıştırın
4. Kurulum sihirbazını takip edin (tüm varsayılan ayarları kabul edin)
5. Kurulumu doğrulayın:
   ```bash
   # Komut İstemi veya PowerShell açın
   node --version
   npm --version
   ```
   Çıktı:
   ```
   v20.x.x
   10.x.x
   ```

#### macOS:
```bash
# Homebrew kullanarak (önerilir)
brew install node@20

# Kurulumu doğrula
node --version
npm --version
```

#### Linux (Ubuntu/Debian):
```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js'i yükle
sudo apt-get install -y nodejs

# Kurulumu doğrula
node --version
npm --version
```

### 2.2. Git Kurulumu

#### Windows:
1. [Git for Windows](https://git-scm.com/download/win) indirin
2. Yükleyiciyi çalıştırın
3. Tüm varsayılan ayarları kabul edin

#### macOS:
```bash
# Homebrew ile
brew install git

# Veya Xcode Command Line Tools
xcode-select --install
```

#### Linux:
```bash
sudo apt-get update
sudo apt-get install git
```

Kurulumu doğrulayın:
```bash
git --version
```

---

## 3. Projeyi İndirme

### 3.1. Repository'yi Clone Edin

Terminal veya Komut İstemi açın ve projeyi indirmek istediğiniz klasöre gidin:

```bash
# Windows Örnek
cd C:\Users\KullaniciAdi\Documents

# macOS/Linux Örnek
cd ~/Documents

# Projeyi clone edin
git clone https://github.com/kullanici-adi/valorant-matcher.git

# Proje klasörüne girin
cd valorant-matcher

# Branch'i kontrol edin
git checkout claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
```

### 3.2. Proje Yapısını Kontrol Edin

```bash
# Dosyaları listeleyin
dir   # Windows
ls    # macOS/Linux
```

Şu klasörleri görmelisiniz:
```
📁 app/
📁 components/
📁 lib/
📁 prisma/
📄 package.json
📄 README.md
📄 .env.example
```

---

## 4. Veritabanı Kurulumu

İki seçeneğiniz var: **Docker (Kolay)** veya **Manuel PostgreSQL Kurulumu**

### Seçenek A: Docker ile PostgreSQL (ÖNERİLİR) 🐳

#### 4.1. Docker Kurulumu

**Windows/macOS:**
1. [Docker Desktop](https://www.docker.com/products/docker-desktop) indirin
2. Kurulumu yapın ve bilgisayarınızı yeniden başlatın
3. Docker Desktop'ı açın

**Linux:**
```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER

# Yeniden giriş yapın veya bilgisayarı yeniden başlatın
```

#### 4.2. PostgreSQL Container'ı Başlatın

Terminal'de şu komutu çalıştırın:

```bash
docker run --name needone-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=needone2024 \
  -e POSTGRES_DB=needone \
  -p 5432:5432 \
  -d postgres:15
```

**Windows PowerShell için:**
```powershell
docker run --name needone-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=needone2024 `
  -e POSTGRES_DB=needone `
  -p 5432:5432 `
  -d postgres:15
```

#### 4.3. Container'ın Çalıştığını Doğrulayın

```bash
docker ps
```

Çıktı:
```
CONTAINER ID   IMAGE         STATUS         PORTS                    NAMES
abc123def456   postgres:15   Up 2 minutes   0.0.0.0:5432->5432/tcp   needone-postgres
```

#### 4.4. Container'ı Durdurma/Başlatma

```bash
# Durdurmak için
docker stop needone-postgres

# Başlatmak için
docker start needone-postgres

# Silmek için (VERİLER SİLİNİR!)
docker rm -f needone-postgres
```

### Seçenek B: Manuel PostgreSQL Kurulumu

#### Windows:
1. [PostgreSQL indirme sayfasına](https://www.postgresql.org/download/windows/) gidin
2. Windows installer'ı indirin (PostgreSQL 15)
3. Kurulum sırasında:
   - Şifre: `needone2024` (veya kendi şifrenizi)
   - Port: `5432` (varsayılan)
   - Stack Builder'ı atlayabilirsiniz

#### macOS:
```bash
# Homebrew ile
brew install postgresql@15

# PostgreSQL'i başlat
brew services start postgresql@15

# Veritabanı oluştur
createdb needone
```

#### Linux:
```bash
# PostgreSQL yükle
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# PostgreSQL'i başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Veritabanı oluştur
sudo -u postgres createdb needone

# Şifre ayarla
sudo -u postgres psql
ALTER USER postgres PASSWORD 'needone2024';
\q
```

---

## 5. Ortam Değişkenlerini Ayarlama

### 5.1. .env Dosyası Oluşturma

Proje klasöründe `.env.example` dosyasını `.env` olarak kopyalayın:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 5.2. .env Dosyasını Düzenleme

`.env` dosyasını bir metin editöründe açın ve şu değerleri güncelleyin:

```env
# ============================================
# VERITABANI BAĞLANTISI
# ============================================
# Docker kullanıyorsanız:
DATABASE_URL="postgresql://postgres:needone2024@localhost:5432/needone"

# Manuel PostgreSQL (farklı şifre kullandıysanız):
# DATABASE_URL="postgresql://postgres:SIZIN_SIFRENIZ@localhost:5432/needone"

# ============================================
# NEXTAUTH GÜVENLİK ANAHTARI
# ============================================
# Aşağıdaki komutu çalıştırıp çıktıyı buraya yapıştırın:
# Windows PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
# macOS/Linux: openssl rand -base64 32

NEXTAUTH_SECRET="BURAYA_OLUŞTURDUĞUNUZ_ANAHTARI_YAPIŞTIRIN"

# ============================================
# UYGULAMA URL'İ
# ============================================
# Yerel geliştirme için:
NEXTAUTH_URL="http://localhost:3000"

# Production için domain adresiniz olacak:
# NEXTAUTH_URL="https://needone.com"

# ============================================
# DISCORD OAUTH (OPSİYONEL)
# ============================================
# Şimdilik boş bırakabilirsiniz
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# ============================================
# WEBSOCKET PORT (OPSİYONEL)
# ============================================
WS_PORT=3001
```

### 5.3. NEXTAUTH_SECRET Oluşturma

**Windows PowerShell:**
```powershell
# PowerShell'de çalıştırın
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

Çıktıyı kopyalayıp `.env` dosyasındaki `NEXTAUTH_SECRET` değerine yapıştırın.

**Örnek:**
```env
NEXTAUTH_SECRET="Xy7kP2mN9vB4wQ8tR5jL1hG6fD3sA0zC="
```

---

## 6. Bağımlılıkları Yükleme

Proje klasöründe terminal açın ve şu komutu çalıştırın:

```bash
npm install
```

Bu işlem **2-5 dakika** sürebilir. İnternete bağlı olduğunuzdan emin olun.

**Beklenen çıktı:**
```
added 515 packages, and audited 516 packages in 45s

160 packages are looking for funding
  run `npm fund` for details
```

**Sorun yaşarsanız:**
```bash
# npm cache'i temizleyin
npm cache clean --force

# Tekrar deneyin
npm install
```

---

## 7. Veritabanını Başlatma

### 7.1. Prisma Client Oluşturma

```bash
npm run db:generate
```

**Çıktı:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 7.2. Veritabanı Şemasını Uygulama

```bash
npm run db:push
```

**Çıktı:**
```
Applying migration...
🚀  Your database is now in sync with your Prisma schema.
```

### 7.3. Örnek Veri Yükleme (Opsiyonel ama Önerilir)

```bash
npm run db:seed
```

**Çıktı:**
```
🌱 Starting seed...
✅ Created test users
✅ Created sample listings
✅ Created sample application
✅ Created sample chat messages
✅ Created sample rating
🎉 Seed completed successfully!

📧 Test accounts:
   Email: admin@needone.gg (Admin)
   Email: captain@needone.gg (Team Captain)
   Email: duelist@needone.gg (Solo Duelist)
   Email: controller@needone.gg (Controller)
   Email: initiator@needone.gg (Initiator)
   Password for all: password123
```

### 7.4. Veritabanını Görselleştirme (Opsiyonel)

```bash
npm run db:studio
```

Tarayıcınızda otomatik olarak Prisma Studio açılacak (http://localhost:5555).
Buradan veritabanınızdaki tüm verileri görüp düzenleyebilirsiniz.

---

## 8. Uygulamayı Çalıştırma

### 8.1. Development Modunda Başlatma

```bash
npm run dev
```

**Beklenen çıktı:**
```
  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 3.2s
```

### 8.2. Tarayıcıda Açma

1. Tarayıcınızı açın
2. Şu adrese gidin: **http://localhost:3000**
3. Ana sayfayı görmelisiniz 🎉

### 8.3. Uygulamayı Durdurma

Terminal'de **Ctrl+C** (Windows/Linux) veya **Cmd+C** (macOS) tuşlarına basın.

---

## 9. İlk Kullanım

### 9.1. Seed Verisi Kullanarak Giriş

Eğer seed komutunu çalıştırdıysanız, hazır test hesapları vardır:

1. **http://localhost:3000/login** adresine gidin
2. Şu bilgilerle giriş yapın:
   ```
   Email: admin@needone.gg
   Password: password123
   ```

### 9.2. Yeni Hesap Oluşturma

1. **http://localhost:3000/register** adresine gidin
2. Email ve şifrenizi girin
3. "Create Account" tıklayın
4. Profil oluşturma sayfasına yönlendirileceksiniz

### 9.3. Profil Oluşturma

İlk girişte profil tamamlamanız gerekir:

1. **In-Game Bilgileri:**
   - Oyun içi adınız: `TestPlayer`
   - Tagline: `#1234`
   - Region: `TR` (Türkiye) seçin

2. **Rank & Role:**
   - Current Rank: Mevcut rank'inizi seçin
   - Peak Rank: En yüksek rank'inizi seçin
   - Main Role: Ana rolünüzü seçin (Duelist, Controller, vb.)

3. **Agents:**
   - En az 1, en fazla 10 agent seçin
   - İlk seçtiğiniz agent otomatik "main" olarak işaretlenir (⭐)

4. **Communication:**
   - En az 1 dil seçin (Türkçe, İngilizce, vb.)
   - Mikrofon var/yok işaretleyin
   - Playstyle seçin (Casual, Normal, Tryhard)

5. **Save Profile** tıklayın

### 9.4. İlk Listing Oluşturma

1. Dashboard'dan **"Create Listing"** tıklayın
2. Listing tipini seçin:
   - **Team:** 4 kişilik takımınız için 5. oyuncu arıyorsunuz
   - **Solo:** Kendiniz bir takıma katılmak istiyorsunuz

3. Formu doldurun:
   - Başlık (ör: "Diamond 4-stack LF1 Controller")
   - Oyun modu (Ranked, Premier, vb.)
   - Region ve diller
   - Rank aralığı
   - İstenen rol (opsiyonel)
   - Açıklama
   - Süre (30 dakika - 4 saat)

4. **Create Listing** tıklayın

### 9.5. Listing'lere Göz Atma

1. **"Browse Listings"** veya **"Find Players"** tıklayın
2. Filtreleri kullanın:
   - Listing tipi (Team/Solo)
   - Oyun modu
   - Region
   - Rank aralığı
   - Rol

3. Bir listing'e tıklayarak detayları görün
4. **"Apply to Join"** ile başvurun veya chat yapın

---

## 10. Discord OAuth Kurulumu (Opsiyonel)

Discord ile giriş özelliğini aktif etmek için:

### 10.1. Discord Developer Portal

1. [Discord Developer Portal](https://discord.com/developers/applications) gidin
2. **"New Application"** tıklayın
3. Uygulama adı: `NeedOne` (veya istediğiniz isim)
4. **Create** tıklayın

### 10.2. OAuth2 Ayarları

1. Sol menüden **OAuth2** → **General** seçin
2. **Client ID**'yi kopyalayın
3. **Client Secret** oluşturun ve kopyalayın
4. **Redirects** bölümüne ekleyin:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
5. **Save Changes** tıklayın

### 10.3. .env Dosyasını Güncelleme

`.env` dosyasını açın ve ekleyin:

```env
DISCORD_CLIENT_ID="kopyaladığınız_client_id"
DISCORD_CLIENT_SECRET="kopyaladığınız_client_secret"
```

### 10.4. Uygulamayı Yeniden Başlatma

```bash
# Ctrl+C ile durdurun
# Tekrar başlatın
npm run dev
```

Artık login sayfasında **"Discord ile giriş"** butonu çalışacak!

---

## 11. Production Deployment

### 11.1. Vercel Deployment (Önerilir)

1. **Vercel Hesabı Oluşturun:**
   - [vercel.com](https://vercel.com) gidin
   - GitHub hesabınızla giriş yapın

2. **PostgreSQL Veritabanı:**
   - [Supabase](https://supabase.com) (Ücretsiz)
   - [Neon](https://neon.tech) (Ücretsiz)
   - [Railway](https://railway.app) (Ücretsiz tier)

   Supabase örneği:
   - Supabase'de yeni proje oluşturun
   - Connection string'i alın:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

3. **Vercel'de Deploy:**
   ```bash
   # Vercel CLI yükleyin
   npm i -g vercel

   # Deploy edin
   vercel
   ```

4. **Environment Variables Ekleyin:**
   Vercel dashboard'da Project Settings → Environment Variables:
   ```
   DATABASE_URL=supabase_connection_string
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=https://your-app.vercel.app
   DISCORD_CLIENT_ID=your_discord_id
   DISCORD_CLIENT_SECRET=your_discord_secret
   ```

5. **Veritabanını Migrate Edin:**
   ```bash
   # Local'de production veritabanına bağlanın
   DATABASE_URL="production_url" npm run db:push
   DATABASE_URL="production_url" npm run db:seed
   ```

### 11.2. Railway Deployment

1. [Railway.app](https://railway.app) gidin
2. GitHub ile giriş yapın
3. **New Project** → **Deploy from GitHub repo**
4. Repository'nizi seçin
5. **Add PostgreSQL** servisini ekleyin
6. Environment variables'ları ayarlayın
7. Deploy!

---

## 12. Sorun Giderme

### Sorun 1: `npm install` Hatası

**Hata:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Çözüm:**
```bash
# Windows: Admin olarak çalıştırın
# macOS/Linux:
sudo npm install --unsafe-perm=true
```

### Sorun 2: Port 3000 Kullanımda

**Hata:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Çözüm:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Veya farklı port kullanın
PORT=3001 npm run dev
```

### Sorun 3: Veritabanı Bağlantı Hatası

**Hata:**
```
Error: Can't reach database server at `localhost:5432`
```

**Kontroller:**
1. PostgreSQL çalışıyor mu?
   ```bash
   # Docker
   docker ps

   # Manuel
   # Windows: Services'ten kontrol edin
   # macOS: brew services list
   # Linux: systemctl status postgresql
   ```

2. `.env` dosyasındaki `DATABASE_URL` doğru mu?
3. Port 5432 kullanımda mı başka bir uygulama tarafından?

**Çözüm:**
```bash
# Docker'ı yeniden başlat
docker restart needone-postgres

# Manuel PostgreSQL
sudo systemctl restart postgresql
```

### Sorun 4: Prisma Client Hatası

**Hata:**
```
Error: @prisma/client did not initialize yet
```

**Çözüm:**
```bash
npm run db:generate
```

### Sorun 5: NextAuth Session Hatası

**Hata:**
```
[next-auth][error][CLIENT_FETCH_ERROR]
```

**Çözüm:**
1. `NEXTAUTH_SECRET` ayarlandı mı kontrol edin
2. `NEXTAUTH_URL` doğru mu kontrol edin
3. Uygulamayı yeniden başlatın

### Sorun 6: Seed Hatası

**Hata:**
```
Unique constraint failed
```

**Çözüm:**
```bash
# Veritabanını sıfırlayın
npm run db:push --force-reset

# Seed'i tekrar çalıştırın
npm run db:seed
```

### Sorun 7: Discord OAuth Çalışmıyor

**Kontroller:**
1. Discord Developer Portal'da redirect URL doğru mu?
2. `.env` dosyasında Client ID ve Secret doğru mu?
3. Uygulamayı yeniden başlattınız mı?

---

## 📚 Ek Kaynaklar

- **Next.js Dokümantasyonu:** https://nextjs.org/docs
- **Prisma Dokümantasyonu:** https://www.prisma.io/docs
- **NextAuth.js Dokümantasyonu:** https://next-auth.js.org
- **PostgreSQL Dokümantasyonu:** https://www.postgresql.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## 🆘 Yardım İçin

Sorun yaşıyorsanız:

1. **Terminal çıktısını kontrol edin** - Hata mesajları genellikle sorunu açıklar
2. **Google'da arayın** - Hata mesajını olduğu gibi arayın
3. **GitHub Issues** - Proje repository'sinde issue açın
4. **Discord/Slack** - Topluluk desteği alın

---

## ✅ Kurulum Tamamlandı!

Başarıyla kurulum yaptıysanız şunları yapabilirsiniz:

- ✅ Hesap oluşturma ve giriş yapma
- ✅ Profil oluşturma ve düzenleme
- ✅ Listing oluşturma (Team/Solo)
- ✅ Listing'lere göz atma ve filtreleme
- ✅ Listing'lere başvurma
- ✅ Chat mesajlaşma
- ✅ Kullanıcıları değerlendirme
- ✅ Kullanıcıları raporlama/engelleme
- ✅ Admin paneli (admin hesabıyla)

**İyi oyunlar ve iyi eşleşmeler! 🎮🚀**
