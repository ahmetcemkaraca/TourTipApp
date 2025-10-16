const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK for emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
  projectId: 'tourtrip-emulator',
  storageBucket: 'tourtrip-emulator.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Seed data
const seedData = {
  users: [
    {
      id: 'user1',
      email: 'test@tourtrip.app',
      displayName: 'Test Kullanıcı',
      role: 'customer',
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
      profile: {
        firstName: 'Test',
        lastName: 'Kullanıcı',
        phone: '+905551234567',
        preferences: {
          language: 'tr',
          currency: 'TRY',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      }
    },
    {
      id: 'admin1',
      email: 'admin@tourtrip.app',
      displayName: 'Admin Kullanıcı',
      role: 'admin',
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
      profile: {
        firstName: 'Admin',
        lastName: 'Kullanıcı',
        phone: '+905559876543'
      }
    }
  ],
  tours: [
    {
      id: 'tour1',
      title: 'İstanbul Tarihi Yarımada Turu',
      description: 'Sultanahmet ve çevresindeki tarihi yerleri keşfedin',
      location: {
        name: 'İstanbul, Türkiye',
        coordinates: {
          latitude: 41.0082,
          longitude: 28.9784
        },
        address: 'Sultanahmet, Fatih/İstanbul'
      },
      price: {
        amount: 150,
        currency: 'TRY'
      },
      duration: {
        hours: 4,
        days: 0
      },
      maxParticipants: 15,
      category: 'cultural',
      tags: ['history', 'walking', 'cultural'],
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      images: [
        'https://example.com/tour1-1.jpg',
        'https://example.com/tour1-2.jpg'
      ],
      rating: {
        average: 4.5,
        count: 24
      }
    },
    {
      id: 'tour2',
      title: 'Kapadokya Balon Turu',
      description: 'Sıcak hava balonuyla Kapadokya\'nın eşsiz manzarasını izleyin',
      location: {
        name: 'Kapadokya, Nevşehir',
        coordinates: {
          latitude: 38.6431,
          longitude: 34.8309
        },
        address: 'Göreme, Nevşehir'
      },
      price: {
        amount: 450,
        currency: 'TRY'
      },
      duration: {
        hours: 3,
        days: 0
      },
      maxParticipants: 8,
      category: 'adventure',
      tags: ['balloon', 'aerial', 'sunrise'],
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      images: [
        'https://example.com/tour2-1.jpg',
        'https://example.com/tour2-2.jpg'
      ],
      rating: {
        average: 4.8,
        count: 156
      }
    }
  ],
  bookings: [
    {
      id: 'booking1',
      userId: 'user1',
      tourId: 'tour1',
      status: 'confirmed',
      bookingDate: admin.firestore.Timestamp.fromDate(new Date('2024-09-15')),
      participants: [
        {
          firstName: 'Test',
          lastName: 'Kullanıcı',
          email: 'test@tourtrip.app',
          phone: '+905551234567'
        }
      ],
      totalAmount: {
        amount: 150,
        currency: 'TRY'
      },
      paymentStatus: 'paid',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  ],
  reviews: [
    {
      id: 'review1',
      userId: 'user1',
      tourId: 'tour1',
      bookingId: 'booking1',
      rating: 5,
      comment: 'Harika bir deneyimdi! Rehber çok bilgiliydi.',
      isVerified: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }
  ]
};

async function seedDatabase() {
  console.log('🌱 Veritabanına seed veriler ekleniyor...');

  try {
    // Create users in Firebase Auth
    for (const userData of seedData.users) {
      try {
        await auth.createUser({
          uid: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: true
        });
        console.log(`✅ Auth kullanıcısı oluşturuldu: ${userData.email}`);
      } catch (error) {
        if (error.code !== 'auth/uid-already-exists') {
          console.error(`❌ Auth kullanıcısı oluşturulamadı: ${userData.email}`, error);
        }
      }

      // Add user to Firestore
      await db.collection('users').doc(userData.id).set(userData);
      console.log(`✅ Firestore kullanıcısı eklendi: ${userData.id}`);
    }

    // Add tours
    for (const tour of seedData.tours) {
      await db.collection('tours').doc(tour.id).set(tour);
      console.log(`✅ Tur eklendi: ${tour.title}`);
    }

    // Add bookings
    for (const booking of seedData.bookings) {
      await db.collection('bookings').doc(booking.id).set(booking);
      console.log(`✅ Rezervasyon eklendi: ${booking.id}`);
    }

    // Add reviews
    for (const review of seedData.reviews) {
      await db.collection('reviews').doc(review.id).set(review);
      console.log(`✅ Yorum eklendi: ${review.id}`);
    }

    console.log('🎉 Tüm seed veriler başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Seed veri eklenirken hata:', error);
  }
}

async function clearDatabase() {
  console.log('🧹 Veritabanı temizleniyor...');

  const collections = ['users', 'tours', 'bookings', 'reviews', 'analytics_events'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ ${collectionName} koleksiyonu temizlendi`);
  }

  // Clear Auth users
  const listUsers = await auth.listUsers();
  for (const user of listUsers.users) {
    await auth.deleteUser(user.uid);
  }
  console.log('✅ Auth kullanıcıları temizlendi');

  console.log('🎉 Veritabanı başarıyla temizlendi!');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedDatabase();
    break;
  case 'clear':
    clearDatabase();
    break;
  case 'reset':
    clearDatabase().then(() => seedDatabase());
    break;
  default:
    console.log('Kullanım:');
    console.log('  node emulator-setup.js seed   - Seed veriler ekle');
    console.log('  node emulator-setup.js clear  - Veritabanını temizle');
    console.log('  node emulator-setup.js reset  - Temizle ve seed veriler ekle');
}
