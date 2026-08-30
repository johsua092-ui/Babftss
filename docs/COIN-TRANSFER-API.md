# 🪙 Coin Transfer API — BABFT Learning

> Fitur transfer gold antar member + admin grant.
> Semua actions digabung di `/api/ai-chat` via `?action=` parameter.
> Auth: **Firebase ID Token** via `Authorization: Bearer <token>`

---

## Endpoint Base

```
POST /api/ai-chat?action=<ACTION>
GET  /api/ai-chat?action=gold-info
```

| Action | Method | Deskripsi |
|--------|--------|-----------|
| `transfer` | POST | Member kirim gold ke member lain |
| `grant` | POST | Admin bagi gold tanpa potong saldo |
| `transfer-history` | POST | Liat riwayat transfer |
| `gold-info` | GET | Cek saldo + status AI |
| `add-gold` | POST | Admin tambah gold (legacy) |
| `buy-time` | POST | Beli waktu AI pakai gold |
| `activate-timer` | POST | Aktifkan timer AI |

---

## 1. Transfer Gold (Member → Member)

Kirim gold dari saldo sendiri ke UID tujuan.

```js
const res = await fetch('/api/ai-chat?action=transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseIdToken}`
  },
  body: JSON.stringify({
    targetUid: 'FIREBASE_UID_PENERIMA',  // wajib, min 5 chars
    amount: 50,                            // wajib, integer 1-1000
    note: 'Hadiah quiz'                    // opsional, max 100 chars
  })
});
const data = await res.json();
```

### Response Sukses (200)

```json
{
  "message": "Transfer berhasil!",
  "transferId": "tr_1723876123456_abc12345",
  "fromBalance": 150,
  "toBalance": 200,
  "amount": 50
}
```

| Field | Type | Deskripsi |
|-------|------|-----------|
| `message` | string | Status message |
| `transferId` | string | Unique transfer ID |
| `fromBalance` | number | Saldo pengirim setelah transfer |
| `toBalance` | number | Saldo penerima setelah transfer |
| `amount` | number | Jumlah yang ditransfer |

### Error Responses

| Status | Error | Kondisi |
|--------|-------|---------|
| 400 | `"targetUid wajib diisi"` | UID kosong/invalid |
| 400 | `"Amount wajib 1-1000 gold"` | Amount di luar range |
| 400 | `"Nggak bisa transfer ke diri sendiri"` | UID tujuan = UID sendiri |
| 402 | `"Gold kamu kurang!"` | Saldo tidak cukup — `data.gold` = saldo, `data.needed` = butuh |
| 404 | `"User tujuan tidak ditemukan"` | UID tujuan belum pernah login |
| 429 | `"Terlalu banyak transfer..."` | Rate limit: 5 transfer/menit |
| 401 | `"Login required"` | Token invalid/expired |

---

## 2. Admin Grant (Bagi Coin Tanpa Potong Saldo)

Admin bisa bagi gold ke member tanpa saldo admin berkurang.

```js
const res = await fetch('/api/ai-chat?action=grant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    targetUid: 'UID_MEMBER',
    amount: 100,
    note: 'Bonus event'
  })
});
```

### Response Sukses (200)

```json
{
  "message": "Gold di-grant",
  "uid": "target_uid",
  "amount": 100,
  "newBalance": 250
}
```

### Constraints

- ⚠️ **Hanya admin** (UID harus ada di `ADMIN_UIDS` env var)
- Max **10,000** gold per grant
- Jika bukan admin → 403 Forbidden

---

## 3. Riwayat Transfer

Liat log transfer masuk/keluar untuk user yang login.

```js
const res = await fetch('/api/ai-chat?action=transfer-history&limit=20', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({})
});
const data = await res.json();
```

### Response (200)

```json
{
  "transfers": [
    {
      "id": "firestore_doc_id",
      "uid": "my_uid",
      "type": "transfer_out",
      "amount": -50,
      "balanceAfter": 150,
      "createdAt": "2026-08-17T00:00:00.000Z",
      "meta": {
        "transferId": "tr_xxx",
        "toUid": "recipient_uid",
        "note": "Hadiah quiz"
      }
    },
    {
      "id": "firestore_doc_id_2",
      "uid": "my_uid",
      "type": "transfer_in",
      "amount": 30,
      "balanceAfter": 180,
      "createdAt": "2026-08-16T23:45:00.000Z",
      "meta": {
        "transferId": "tr_yyy",
        "fromUid": "sender_uid",
        "note": "Bantuan"
      }
    }
  ]
}
```

### Transfer Types

| Type | Deskripsi | Amount |
|------|-----------|--------|
| `transfer_out` | Gold keluar (kirim ke orang) | Negatif |
| `transfer_in` | Gold masuk (terima dari orang) | Positif |
| `admin_grant` | Gold dari admin (tidak potong saldo admin) | Positif |

### Query Parameters

| Param | Default | Max | Deskripsi |
|-------|---------|-----|-----------|
| `limit` | 20 | 50 | Jumlah record |

---

## 4. Cek Saldo + Status AI

```js
const res = await fetch('/api/ai-chat?action=gold-info', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await res.json();
```

### Response (200)

```json
{
  "isAdmin": false,
  "gold": 150,
  "remainingMinutes": 12,
  "timerActive": true,
  "timerExpiresAt": 1723876123456,
  "packages": [
    { "id": "starter", "label": "5 Menit", "minutes": 5, "gold": 12, "rate": 2.4 },
    { "id": "basic", "label": "15 Menit", "minutes": 15, "gold": 32, "rate": 2.13 },
    { "id": "standard", "label": "30 Menit", "minutes": 30, "gold": 58, "rate": 1.93 },
    { "id": "premium", "label": "60 Menit", "minutes": 60, "gold": 105, "rate": 1.75 }
  ]
}
```

---

## 5. UI Component (React)

Komponen `CoinTransferPanel` udah ada di project:

```jsx
import CoinTransferPanel from '../components/CoinTransferPanel';

function MyPage() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShow(true)}>Transfer Coin</button>
      {show && (
        <CoinTransferPanel
          onClose={() => setShow(false)}
          currentGold={150}     // dari gold-info API
          isAdmin={false}       // dari gold-info API
        />
      )}
    </div>
  );
}
```

### Di AI Helper Panel

Tombol **↔** (ArrowRightLeft icon) udah ada di gold bar — tinggal klik buat buka panel transfer.

---

## Contoh Lengkap: Transfer Flow

```js
// 1. Login & dapat token
const user = await auth.currentUser;
const token = await user.getIdToken();

// 2. Cek saldo dulu
const infoRes = await fetch('/api/ai-chat?action=gold-info', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const info = await infoRes.json();
console.log('Saldo:', info.gold);

// 3. Transfer 25 gold ke temen
const transferRes = await fetch('/api/ai-chat?action=transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    targetUid: 'a1b2c3d4e5f6g7h8i9j0',
    amount: 25,
    note: 'Split quiz reward'
  })
});

if (transferRes.ok) {
  const result = await transferRes.json();
  console.log('Transfer sukses!', result);
  // result.fromBalance = saldo baru
} else {
  const err = await transferRes.json();
  if (transferRes.status === 402) {
    console.log(`Gold kurang! Punya ${err.gold}, butuh ${err.needed}`);
  }
}

// 4. Cek riwayat
const historyRes = await fetch('/api/ai-chat?action=transfer-history&limit=10', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({})
});
const history = await historyRes.json();
console.log('Riwayat:', history.transfers);
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `action=transfer` | 5 request / menit per user |
| `action=grant` | 5 request / menit per user |
| `action=transfer-history` | 5 request / menit per user |
| AI Chat (default) | 10 request / menit per user |

## Max Amounts

| Action | Min | Max |
|--------|-----|-----|
| `transfer` | 1 | 1,000 gold |
| `grant` (admin) | 1 | 10,000 gold |

## Firestore Collections

| Collection | Dokumen | Field Relevan |
|------------|---------|---------------|
| `users/{uid}` | User data | `gold` (integer balance) |
| `gold_log/{auto}` | Transfer log | `uid`, `type`, `amount`, `balanceAfter`, `createdAt`, `meta` |

---

*Last updated: 2026-08-17*
