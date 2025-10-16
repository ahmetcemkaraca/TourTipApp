# TourTrip.app API Kontratları

## Genel Bakış

Bu dokümantasyon, TourTrip.app platformunun tüm API endpoint'lerini, veri şemalarını ve iletişim protokollerini kapsamlı şekilde tanımlar. API'ler **RESTful** prensiplerine uygun olarak tasarlanmış ve **OpenAPI 3.0** standartlarına uyumludur.

## API Genel Yapısı

### Base URL
```
Environment | Base URL
----------- | -----------
Production  | https://api.tourtrip.app/v1
Staging     | https://api-staging.tourtrip.app/v1
Development | http://localhost:5001/tourtrip-app/us-central1/api
```

### Kimlik Doğrulama

Tüm korumalı endpoint'ler için **Bearer Token** gereklidir:

```
Authorization: Bearer <firebase_id_token>
```

### İstek/Response Formatları

- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **Encoding**: UTF-8

### Standart Response Formatı

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

### Error Kodları

| Kod | Açıklama | HTTP Status |
|-----|----------|-------------|
| `VALIDATION_ERROR` | İstek verisi geçersiz | 400 |
| `AUTH_TOKEN_REQUIRED` | Kimlik doğrulama token'ı gerekli | 401 |
| `INVALID_AUTH_TOKEN` | Geçersiz token | 401 |
| `INSUFFICIENT_PERMISSIONS` | Yetersiz yetki | 403 |
| `RESOURCE_NOT_FOUND` | Kaynak bulunamadı | 404 |
| `RESOURCE_CONFLICT` | Kaynak çakışması | 409 |
| `RATE_LIMIT_EXCEEDED` | Hız limiti aşıldı | 429 |
| `INTERNAL_ERROR` | Sunucu hatası | 500 |

## API Endpoints

### 1. Kullanıcı Yönetimi (`/users`)

#### Kullanıcı Profil Bilgilerini Getir
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "user_123",
    email: "user@example.com",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    phone: "+905551234567",
    profilePicture: "https://...",
    preferences: {
      language: "tr",
      currency: "TRY",
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    },
    loyaltyInfo: {
      points: 1250,
      tier: "gold",
      joinDate: "2023-01-15T10:30:00Z"
    }
  }
}
```

#### Kullanıcı Profilini Güncelle
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Mehmet",
  "lastName": "Demir",
  "phone": "+905559876543",
  "preferences": {
    "language": "en",
    "currency": "EUR"
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: "Profil başarıyla güncellendi"
  }
}
```

### 2. Tur Yönetimi (`/tours`)

#### Tüm Turları Listele
```http
GET /tours?page=1&limit=10&category=culture&city=istanbul&minPrice=100&maxPrice=500
```

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına öğe sayısı (default: 10, max: 50)
- `category`: Tur kategorisi
- `city`: Şehir
- `minPrice`: Minimum fiyat
- `maxPrice`: Maksimum fiyat
- `rating`: Minimum puan
- `featured`: Öne çıkan turlar (true/false)

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: "tour_123",
      title: "İstanbul Tarihi Yarımada Turu",
      description: "Şehirin en önemli tarihi yerlerini keşfedin...",
      category: "culture",
      price: {
        amount: 299,
        currency: "TRY",
        priceType: "per_person"
      },
      duration: {
        value: 8,
        unit: "hours"
      },
      capacity: {
        min: 2,
        max: 15
      },
      location: {
        city: "İstanbul",
        country: "Türkiye",
        coordinates: {
          latitude: 41.0082,
          longitude: 28.9784
        }
      },
      images: ["https://...", "https://..."],
      averageRating: 4.8,
      reviewCount: 127,
      featured: true,
      createdAt: "2023-01-15T10:30:00Z"
    }
  ],
  meta: {
    pagination: {
      page: 1,
      limit: 10,
      total: 245,
      totalPages: 25,
      hasNext: true,
      hasPrev: false
    }
  }
}
```

#### Tek Tur Detayını Getir
```http
GET /tours/{tourId}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "tour_123",
    providerId: "provider_456",
    title: "İstanbul Tarihi Yarımada Turu",
    description: "Ayasofya, Sultanahmet Camii, Topkapı Sarayı ve Kapalıçarşı'yı içeren kapsamlı bir kültür turu.",
    category: "culture",
    subCategory: "historical",
    price: {
      amount: 299,
      currency: "TRY",
      priceType: "per_person"
    },
    duration: {
      value: 8,
      unit: "hours"
    },
    capacity: {
      min: 2,
      max: 15
    },
    location: {
      address: {
        street: "Sultanahmet Meydanı",
        city: "İstanbul",
        state: "İstanbul",
        country: "Türkiye",
        postalCode: "34122"
      },
      coordinates: {
        latitude: 41.0082,
        longitude: 28.9784
      },
      meetingPoint: "Ayasofya Müzesi girişi"
    },
    inclusions: [
      "Profesyonel rehber",
      "Giriş ücretleri",
      "Öğle yemeği",
      "Transfer servisi"
    ],
    exclusions: [
      "Kişisel harcamalar",
      "Fotoğraf çekimi ücretleri"
    ],
    itinerary: [
      {
        day: 1,
        title: "Tarihi Yarımada Keşfi",
        description: "Ayasofya ve Sultanahmet Camii ziyareti",
        duration: "3 saat",
        activities: ["rehberli_tur", "fotoğraf_durakları"]
      }
    ],
    availability: [
      {
        date: "2024-01-20",
        startTime: "09:00",
        endTime: "17:00",
        availableSpots: 8
      }
    ],
    tags: ["aile_dostu", "engelli_erişilebilir", "fotoğraf_turu"],
    policies: {
      cancellation: "24 saat öncesine kadar ücretsiz iptal",
      refund: "Kredi kartı veya banka havalesi ile iade",
      minimumAge: 12
    },
    difficulty: "easy",
    status: "active",
    featured: true,
    averageRating: 4.8,
    reviewCount: 127,
    bookingCount: 89,
    viewCount: 1247,
    images: ["https://...", "https://...", "https://..."],
    createdAt: "2023-01-15T10:30:00Z",
    updatedAt: "2023-12-01T14:20:00Z"
  }
}
```

#### Yeni Tur Oluştur (Sağlayıcı)
```http
POST /tours
Authorization: Bearer <provider_token>
Content-Type: application/json

{
  "title": "Kapadokya Balon Turu",
  "description": "Dünyanın en güzel balon manzarasını deneyimleyin",
  "category": "adventure",
  "price": {
    "amount": 899,
    "currency": "TRY",
    "priceType": "per_person"
  },
  "duration": {
    "value": 3,
    "unit": "hours"
  },
  "capacity": {
    "min": 1,
    "max": 20
  },
  "location": {
    "city": "Göreme",
    "country": "Türkiye",
    "coordinates": {
      "latitude": 38.6431,
      "longitude": 34.8308
    }
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Balon Uçuşu",
      "description": "Gün doğumu balon uçuşu",
      "activities": ["uçuş", "fotoğraf", "şampanya"]
    }
  ],
  "amenities": ["pilot", "sigorta", "transfer"],
  "images": ["https://cdn.tourtrip.app/balon1.jpg"],
  "difficulty": "easy",
  "tags": ["macera", "fotoğraf", "romantik"]
}
```

**Validation Rules:**
- `title`: 1-200 karakter arası, zorunlu
- `description`: 1-2000 karakter arası, zorunlu
- `price.amount`: Pozitif sayı, zorunlu
- `capacity.min`: 1 veya daha fazla, zorunlu
- `location.coordinates`: Geçerli GPS koordinatları, zorunlu
- `images`: En az 1 resim URL'i, zorunlu

### 3. Rezervasyon Yönetimi (`/bookings`)

#### Yeni Rezervasyon Oluştur
```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "tourId": "tour_123",
  "participants": [
    {
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "age": 30,
      "specialRequests": "Vejetaryen yemek tercih ediyorum"
    },
    {
      "name": "Ayşe Yılmaz",
      "email": "ayse@example.com",
      "age": 28
    }
  ],
  "selectedDate": "2024-01-20T09:00:00Z",
  "totalAmount": 598,
  "paymentMethod": "credit_card",
  "specialRequests": "Grup fotoğrafı çekmek istiyoruz"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: "booking_789",
    userId: "user_123",
    tourId: "tour_123",
    providerId: "provider_456",
    participants: [...],
    selectedDate: "2024-01-20T09:00:00Z",
    totalAmount: {
      amount: 598,
      currency: "TRY",
      breakdown: {
        basePrice: 299,
        taxes: 47.84,
        fees: 29.90,
        discounts: 0,
        totalPrice: 598
      }
    },
    paymentStatus: "pending",
    bookingStatus: "confirmed",
    createdAt: "2023-12-15T16:45:00Z"
  }
}
```

#### Kullanıcının Rezervasyonlarını Listele
```http
GET /bookings?status=confirmed&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: `pending`, `confirmed`, `cancelled`, `completed`
- `page`: Sayfa numarası
- `limit`: Sayfa başına öğe sayısı

### 4. Ödeme İşlemleri (`/payments`)

#### Ödeme Intent Oluştur
```http
POST /payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingIds": ["booking_789"],
  "amount": 598,
  "currency": "TRY",
  "paymentMethod": "credit_card",
  "customerInfo": {
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone": "+905551234567"
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    clientSecret: "pi_xxx_secret_xxx",
    paymentIntentId: "pi_1234567890",
    customerId: "cus_abcdefghijk"
  }
}
```

#### Ödeme İadesi İşle
```http
POST /payments/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "amount": 299,
  "reason": "Müşteri talebi"
}
```

### 5. Yorum ve Puanlama (`/reviews`)

#### Tur Yorumu Ekle
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "tourId": "tour_123",
  "rating": 5,
  "title": "Harika bir deneyim!",
  "comment": "Rehber çok bilgiliydi ve tur çok iyi organize edilmişti. Kesinlikle tavsiye ederim.",
  "photos": ["https://cdn.tourtrip.app/review1.jpg"]
}
```

**Validation Rules:**
- `rating`: 1-5 arası tam sayı, zorunlu
- `title`: 1-100 karakter arası, zorunlu
- `comment`: 1-1000 karakter arası, zorunlu
- Kullanıcı daha önce bu turu tamamlamış olmalı

### 6. Grup Rezervasyonları (`/group-bookings`)

#### Grup Rezervasyonu Oluştur
```http
POST /group-bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "tourId": "tour_123",
  "name": "Şirket Gezisi",
  "description": "Yıllık şirket etkinliği için grup turu",
  "participants": [
    {
      "name": "Ahmet Yılmaz",
      "email": "ahmet@company.com"
    },
    {
      "name": "Ayşe Demir",
      "email": "ayse@company.com"
    }
  ],
  "selectedDate": "2024-01-20T09:00:00Z",
  "totalAmount": 3000
}
```

### 7. Bildirim Yönetimi (`/notifications`)

#### Bildirim Tercihlerini Güncelle
```http
PUT /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": {
    "email": true,
    "push": true,
    "sms": false,
    "categories": {
      "booking_confirmations": true,
      "tour_reminders": true,
      "promotional_offers": false,
      "system_updates": true
    }
  }
}
```

### 8. Admin İşlemleri (`/admin`)

#### Sistem Metrikleri
```http
GET /admin/metrics
Authorization: Bearer <admin_token>
```

**Response:**
```typescript
{
  success: true,
  data: {
    users: {
      total: 15420,
      active: 8934,
      newThisMonth: 1247
    },
    bookings: {
      total: 8934,
      thisMonth: 1247,
      revenue: 2456789,
      currency: "TRY"
    },
    tours: {
      total: 892,
      active: 756,
      averageRating: 4.6
    },
    system: {
      uptime: 99.9,
      responseTime: 245,
      errorRate: 0.1
    }
  }
}
```

## Veri Şemaları (Schemas)

### Tour Şeması
```typescript
interface Tour {
  id: string;
  providerId: string;
  title: string; // 1-200 karakter
  description: string; // 1-2000 karakter
  category: 'culture' | 'adventure' | 'food' | 'nature' | 'shopping' | 'entertainment';
  subCategory?: string;
  price: {
    amount: number;
    currency: string;
    priceType: 'per_person' | 'fixed' | 'per_group';
  };
  duration: {
    value: number;
    unit: 'hours' | 'days' | 'minutes';
  };
  capacity: {
    min: number;
    max: number;
  };
  location: {
    address: Address;
    coordinates: Coordinates;
    meetingPoint: string;
  };
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day?: number;
    title: string;
    description: string;
    duration?: string;
    activities?: string[];
  }>;
  availability: Array<{
    date: string;
    startTime: string;
    endTime: string;
    availableSpots: number;
    price?: number;
  }>;
  tags: string[];
  policies: {
    cancellation: string;
    refund: string;
    minimumAge?: number;
    requirements?: string[];
  };
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  bookingCount: number;
  viewCount: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Booking Şeması
```typescript
interface Booking {
  id: string;
  userId: string;
  tourId: string;
  providerId: string;
  participants: Array<{
    name: string;
    email: string;
    phone?: string;
    age?: number;
    specialRequests?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  }>;
  selectedDate: string;
  startTime: string;
  endTime: string;
  totalAmount: {
    amount: number;
    currency: string;
    breakdown: {
      basePrice: number;
      taxes: number;
      fees: number;
      discounts: number;
      totalPrice: number;
    };
  };
  paymentInfo: {
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    paymentId?: string;
    paymentMethod?: string;
    paidAt?: string;
    refundedAmount?: number;
    refundReason?: string;
  };
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  internalNotes?: string;
  groupBookingId?: string;
  multiServiceBookingId?: string;
  addOns?: Array<{
    addOnId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  insuranceInfo?: {
    policyId: string;
    premium: number;
    coverage: string;
    status: 'active' | 'expired' | 'claimed';
  };
  transportationInfo?: {
    pickupLocation?: {
      address: string;
      coordinates: Coordinates;
    };
    dropoffLocation?: {
      address: string;
      coordinates: Coordinates;
    };
    taxiBookingId?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Hata İşleme

### Validation Hataları
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Geçersiz istek verisi",
    details: [
      {
        field: "participants[0].email",
        message: "Geçerli bir email adresi giriniz"
      },
      {
        field: "selectedDate",
        message: "Geçmiş tarih seçilemez"
      }
    ]
  }
}
```

### Kimlik Doğrulama Hataları
```typescript
{
  success: false,
  error: {
    code: "INVALID_AUTH_TOKEN",
    message: "Geçersiz kimlik doğrulama token'ı"
  }
}
```

## Rate Limiting

- **Window**: 15 dakika
- **Max Requests**: 100 istek/IP
- **Headers**:
  - `X-RateLimit-Limit`: Maksimum istek sayısı
  - `X-RateLimit-Remaining`: Kalan istek sayısı
  - `X-RateLimit-Reset`: Reset zamanı (Unix timestamp)

## Versioning

API versioning semantik versioning kullanır:
- **v1**: Mevcut stabil sürüm
- **v2**: Gelecekteki büyük değişiklikler için

Breaking changes için yeni versiyon yayınlanır.

## Webhook'lar

### Ödeme Webhook'u
```http
POST /webhooks/stripe
X-Stripe-Signature: t=1234567890,v1=signature...

{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "metadata": {
        "bookingIds": "booking_789,booking_790"
      }
    }
  }
}
```

## Test Ortamı

Development ortamında API'yi test etmek için:

```bash
# Firebase emülatörlerini başlat
npm run firebase:emulators

# API'yi test et
curl -X GET http://localhost:5001/tourtrip-app/us-central1/api/tours \
  -H "Authorization: Bearer <test_token>"
```

Bu kontratlar, TourTrip.app API'lerinin tüm teknik detaylarını ve kullanım kurallarını tanımlar.
