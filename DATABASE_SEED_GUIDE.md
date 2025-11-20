# Database Seed Guide - Mağaza Ürünlerini Eklemek İçin

Mağazada ürünleri görmek için database'e store items eklemeniz gerekiyor.

## Yöntem 1: TypeScript Seed (Önerilen)

```bash
# 1. Prisma client'ı generate et
npx prisma generate

# 2. Seed'i çalıştır
npx tsx prisma/seed.ts
# veya
npm run db:seed
```

**NOT:** Eğer `tsx: not found` hatası alırsanız:
```bash
npm install
npx tsx prisma/seed.ts
```

## Yöntem 2: Store Items Seed (Sadece Mağaza)

Eğer sadece store items'ları eklemek istiyorsanız:

```bash
npx tsx prisma/store-seed.ts
```

## Yöntem 3: SQL ile Direkt Ekleme

Eğer TypeScript seed çalışmazsa, SQL dosyasını kullanabilirsiniz:

### PostgreSQL ile:
```bash
psql -d your_database_name -f prisma/seed-store-items.sql
```

### Database Tool ile (pgAdmin, DBeaver, etc.):
1. `prisma/seed-store-items.sql` dosyasını açın
2. SQL içeriğini database'inize çalıştırın

### Prisma Studio ile:
```bash
npx prisma studio
```
Açılan web arayüzde:
1. `StoreItem` tablosuna gidin
2. Manuel olarak kayıtları ekleyin

## Yöntem 4: API Üzerinden Test

Geliştirme sırasında test için bir API endpoint oluşturabilirsiniz:

`app/api/admin/seed-store/route.ts` oluşturun:
```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { storeItems } from "@/prisma/store-seed"

export async function POST(req: Request) {
  try {
    for (const item of storeItems) {
      await prisma.storeItem.upsert({
        where: { nameEn: item.nameEn },
        update: item,
        create: item,
      })
    }
    return NextResponse.json({ success: true, count: storeItems.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
```

Sonra:
```bash
curl -X POST http://localhost:3000/api/admin/seed-store
```

## Kontrol

Store items'ların eklendiğini kontrol etmek için:

### Prisma Studio:
```bash
npx prisma studio
```

### SQL Query:
```sql
SELECT "nameEn", "vpAmount", "nPointsCost", "isActive"
FROM "store_items"
ORDER BY "sortOrder";
```

Çıktı şöyle olmalı:
```
| nameEn      | vpAmount | nPointsCost | isActive |
|-------------|----------|-------------|----------|
| 475 VP      | 475      | 5000        | true     |
| 1,000 VP    | 1000     | 10000       | true     |
| 2,050 VP    | 2050     | 20000       | true     |
| 3,650 VP    | 3650     | 35000       | true     |
| 5,350 VP    | 5350     | 50000       | true     |
| 11,000 VP   | 11000    | 100000      | true     |
```

## Sorun Giderme

### "Module not found" hatası:
```bash
npm install
npx prisma generate
```

### Prisma engine indirme hatası:
Bu durumda SQL yöntemini kullanın (Yöntem 3).

### Store hala boş görünüyor:
1. Browser cache'i temizleyin (Ctrl+Shift+R veya Cmd+Shift+R)
2. Logout/login yapın
3. API'yi test edin: `http://localhost:3000/api/store`

## Başarı!

Seed tamamlandıktan sonra `/store` sayfasında 6 VP paketi görmelisiniz:
- ✅ 475 VP = 5,000 N-Points
- ✅ 1,000 VP = 10,000 N-Points
- ✅ 2,050 VP = 20,000 N-Points
- ✅ 3,650 VP = 35,000 N-Points
- ✅ 5,350 VP = 50,000 N-Points
- ✅ 11,000 VP = 100,000 N-Points
