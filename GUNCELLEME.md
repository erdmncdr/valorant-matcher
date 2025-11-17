# 🔄 Local Dosyaları Güncelleme Rehberi

## Yöntem 1: Git Pull (Önerilir)

### Adım 1: Local değişikliklerinizi kontrol edin
```bash
# Proje klasörüne gidin
cd valorant-matcher

# Değişiklikleri kontrol edin
git status
```

### Adım 2: Eğer local değişiklikleriniz varsa

**Seçenek A - Kaydetmek istiyorsanız:**
```bash
# Değişikliklerinizi kaydedin
git add -A
git commit -m "Local değişikliklerim"
```

**Seçenek B - Kaydetmek istemiyorsanız:**
```bash
# Tüm local değişiklikleri geri alın (DİKKAT: Kaybolur!)
git reset --hard HEAD
```

### Adım 3: Güncellemeleri çekin
```bash
# Remote'dan en son değişiklikleri çekin
git pull origin claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
```

---

## Yöntem 2: Manuel Güncelleme

Eğer Git kullanmak istemiyorsanız:

1. **GitHub'dan son halini indirin**
2. **Sadece değişen dosyaları kopyalayın**

### Son güncellenen dosyalar:
```
✅ hooks/use-toast.ts
✅ components/ui/button.tsx
✅ components/ui/checkbox.tsx
✅ components/ui/select.tsx
✅ components/ui/tabs.tsx
✅ components/ui/avatar.tsx
✅ components/ui/toast.tsx
✅ components/ui/separator.tsx
```

Her dosyanın başına sadece şu satırı ekleyin:
```typescript
"use client"
```

---

## Yöntem 3: Hızlı Tek Komut

Eğer local değişikliğiniz yoksa:

```bash
# Proje klasöründe
git fetch origin
git reset --hard origin/claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
```

⚠️ **DİKKAT:** Bu komut tüm local değişikliklerinizi siler!

---

## Güncelleme Sonrası

```bash
# npm run dev çalışıyorsa, durdurun (Ctrl+C)

# Tekrar başlatın
npm run dev
```

Tarayıcıda http://localhost:3000 açın ✅

---

## Sorun Giderme

### "Your branch is behind" hatası
```bash
git pull origin claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
```

### "Conflict" hatası
```bash
# Çakışan dosyaları kontrol edin
git status

# Manuel çözün veya remote'u kabul edin
git checkout --theirs <dosya-adı>

# Sonra
git add -A
git commit -m "Merge remote changes"
```

### Hala hata alıyorsanız
```bash
# Tüm local değişiklikleri sil ve temiz başla
git fetch origin
git reset --hard origin/claude/valorant-matchmaking-app-01AiGQnRjmG5EDyPKZq3iJLZ
git clean -fd
```
