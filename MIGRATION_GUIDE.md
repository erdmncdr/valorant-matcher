# Veritabanı Migration Rehberi

## Gerekli Adımlar

Son güncellemede `reputationScore` field'i `player_profiles` tablosuna eklendi. Bu değişikliği uygulamak için aşağıdaki adımlardan birini takip edin:

### Seçenek 1: Prisma ile Migration (Önerilen)

```bash
# Prisma client'ı yeniden oluştur
npx prisma generate

# Veritabanı schema'sını güncelle
npx prisma db push
```

### Seçenek 2: Manuel SQL Scripti

Eğer Prisma migration çalışmazsa, manuel olarak SQL scriptini çalıştırabilirsiniz:

```bash
# PostgreSQL veritabanına bağlan ve scripti çalıştır
psql $DATABASE_URL -f scripts/add-reputation-score.sql
```

Veya doğrudan SQL komutunu çalıştırın:

```sql
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS "reputationScore" INTEGER NOT NULL DEFAULT 0;

UPDATE player_profiles
SET "reputationScore" = (
  SELECT COALESCE(SUM(score), 0)
  FROM player_ratings
  WHERE player_ratings."targetUserId" = player_profiles."userId"
);
```

### Seçenek 3: Prisma Studio ile Manuel Ekleme

1. Prisma Studio'yu aç: `npx prisma studio`
2. `PlayerProfile` modeline git
3. Schema'yı güncelle (bu seçenek önerilmez, yukarıdaki yöntemleri kullanın)

## Migration Sonrası

Migration tamamlandıktan sonra:

1. Sunucuyu yeniden başlatın
2. `/leaderboard` sayfasını kontrol edin - artık tüm kullanıcılar itibar puanına göre sıralanmalı
3. İtibar verme sistemini test edin - rating verildiğinde reputationScore otomatik güncellenmeli

## Doğrulama

Migration'ın başarılı olup olmadığını kontrol etmek için:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'player_profiles' AND column_name = 'reputationScore';
```

Sonuç:
```
 column_name     | data_type | column_default
-----------------+-----------+----------------
 reputationScore | integer   | 0
```

## Yapılan Değişiklikler

1. **Schema Değişikliği**: `prisma/schema.prisma`
   - `PlayerProfile` modeline `reputationScore Int @default(0)` field'i eklendi

2. **API Güncellemeleri**:
   - `/api/ratings` - Rating oluşturulduğunda reputationScore otomatik güncelleniyor
   - `/api/leaderboard` - Kullanıcılar reputationScore'a göre sıralanıyor
   - `/api/applications/[id]` - Başvuru kabul/red endpoint'i eklendi

3. **UI Güncellemeleri**:
   - Listing detay sayfasında başvuruları kabul/red etme butonları
   - ProfilePreviewCard'a rating butonu eklendi
