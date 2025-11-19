# Aim Trainer Migration Talimatları

## Sorun
Aim trainer skorları kaydedilmiyor çünkü `aim_trainer_scores` tablosu veritabanında yok.

## Çözüm

Migration SQL dosyası hazır: `prisma/migrations/add_aim_trainer.sql`

### Veritabanına Bağlanarak Uygulama

1. **Eğer Supabase kullanıyorsan:**
   - Supabase Dashboard'a git
   - SQL Editor'ü aç
   - `prisma/migrations/add_aim_trainer.sql` dosyasının içeriğini kopyala
   - SQL Editor'e yapıştır ve çalıştır

2. **Eğer psql kullanıyorsan:**
   ```bash
   psql $DATABASE_URL -f prisma/migrations/add_aim_trainer.sql
   ```

3. **Eğer başka bir yöntem kullanıyorsan:**
   - Veritabanı yönetim aracını aç (pgAdmin, DBeaver, vb.)
   - `prisma/migrations/add_aim_trainer.sql` dosyasını çalıştır

## Migration SQL'i

```sql
-- CreateTable
CREATE TABLE IF NOT EXISTS "aim_trainer_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "targetsHit" INTEGER NOT NULL,
    "targetsMissed" INTEGER NOT NULL,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aim_trainer_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "aim_trainer_scores_userId_createdAt_idx" ON "aim_trainer_scores"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "aim_trainer_scores_score_idx" ON "aim_trainer_scores"("score");

-- AddForeignKey
ALTER TABLE "aim_trainer_scores" ADD CONSTRAINT "aim_trainer_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Migration'ı Uyguladıktan Sonra

1. Uygulamayı yeniden başlat (eğer çalışıyorsa)
2. Aim trainer'a git ve oyunu oyna
3. Skor kaydedilecek ve itibar puanı verilecek!
