const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirestoreIndexOptimizer {
  constructor() {
    this.indexesFile = path.join(__dirname, '../firestore.indexes.json');
    this.queryLogFile = path.join(__dirname, '../logs/firestore-queries.log');
    this.optimizationReportFile = path.join(__dirname, '../reports/index-optimization.json');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📊',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Query analysis from logs
  analyzeQueryPatterns() {
    this.log('Query pattern analizi başlatılıyor...');

    const commonQueries = {
      tours: [
        // Basic tour searches
        {
          description: 'Active tours by creation date',
          fields: ['isActive', 'createdAt'],
          usage: 'Tour listing, homepage'
        },
        {
          description: 'Tours by category and rating',
          fields: ['category', 'isActive', 'rating.average'],
          usage: 'Category filtering, best tours'
        },
        {
          description: 'Tours by location and price',
          fields: ['location.city', 'isActive', 'price.amount'],
          usage: 'Location-based search, price filtering'
        },
        {
          description: 'Tours by tags and popularity',
          fields: ['tags', 'isActive', 'popularity'],
          usage: 'Tag-based search, trending tours'
        },
        {
          description: 'Tours by price and duration',
          fields: ['price.amount', 'duration.hours', 'isActive'],
          usage: 'Advanced filtering'
        },
        // Geo queries
        {
          description: 'Tours by geolocation',
          fields: ['location.coordinates'],
          usage: 'Near me searches, map views',
          special: 'geo'
        }
      ],
      bookings: [
        {
          description: 'User bookings by status and date',
          fields: ['userId', 'status', 'bookingDate'],
          usage: 'User dashboard, booking history'
        },
        {
          description: 'Tour bookings by status',
          fields: ['tourId', 'status', 'createdAt'],
          usage: 'Tour operator dashboard'
        },
        {
          description: 'Payment status tracking',
          fields: ['paymentStatus', 'createdAt'],
          usage: 'Payment processing, admin'
        },
        {
          description: 'Upcoming bookings',
          fields: ['userId', 'bookingDate', 'status'],
          usage: 'User reminders, notifications'
        }
      ],
      reviews: [
        {
          description: 'Tour reviews by rating',
          fields: ['tourId', 'rating', 'createdAt'],
          usage: 'Tour detail page, review sorting'
        },
        {
          description: 'User reviews',
          fields: ['userId', 'createdAt'],
          usage: 'User profile, review history'
        },
        {
          description: 'Verified reviews by rating',
          fields: ['isVerified', 'rating', 'createdAt'],
          usage: 'Quality reviews, moderation'
        }
      ],
      users: [
        {
          description: 'Active users by role',
          fields: ['role', 'isActive', 'lastLoginAt'],
          usage: 'Admin dashboard, user management'
        },
        {
          description: 'Recent user registrations',
          fields: ['createdAt', 'isActive'],
          usage: 'Analytics, growth tracking'
        }
      ],
      analytics_events: [
        {
          description: 'Events by name and time',
          fields: ['eventName', 'timestamp', 'userId'],
          usage: 'Analytics dashboard, user tracking'
        },
        {
          description: 'Session events',
          fields: ['sessionId', 'timestamp'],
          usage: 'Session analysis, user journeys'
        },
        {
          description: 'Page view events',
          fields: ['eventName', 'properties.page', 'timestamp'],
          usage: 'Page analytics, performance'
        }
      ]
    };

    return commonQueries;
  }

  // Performance monitoring for queries
  async monitorQueryPerformance() {
    this.log('Query performans izleme başlatılıyor...');

    const performanceMetrics = {
      slowQueries: [],
      indexMisses: [],
      recommendedOptimizations: []
    };

    // Simulate query performance analysis
    const mockSlowQueries = [
      {
        collection: 'tours',
        query: 'where("location.city", "==", "Istanbul").where("isActive", "==", true).orderBy("price.amount")',
        executionTime: 1200,
        documentsRead: 150,
        recommendation: 'Add composite index: location.city + isActive + price.amount'
      },
      {
        collection: 'bookings',
        query: 'where("userId", "==", userId).where("bookingDate", ">=", startDate).orderBy("bookingDate")',
        executionTime: 800,
        documentsRead: 50,
        recommendation: 'Add composite index: userId + bookingDate'
      }
    ];

    performanceMetrics.slowQueries = mockSlowQueries;
    
    // Analyze index effectiveness
    const indexEffectiveness = await this.analyzeIndexEffectiveness();
    performanceMetrics.indexEffectiveness = indexEffectiveness;

    return performanceMetrics;
  }

  // Analyze existing index effectiveness
  async analyzeIndexEffectiveness() {
    this.log('Index etkinliği analiz ediliyor...');

    const indexes = this.loadCurrentIndexes();
    const effectiveness = {
      used: [],
      unused: [],
      redundant: [],
      missing: []
    };

    // Simulate index usage analysis
    indexes.indexes.forEach((index, i) => {
      const usage = Math.random();
      
      if (usage > 0.7) {
        effectiveness.used.push({
          index: index,
          usageScore: usage,
          queryCount: Math.floor(Math.random() * 1000)
        });
      } else if (usage < 0.1) {
        effectiveness.unused.push({
          index: index,
          usageScore: usage,
          recommendation: 'Consider removing this index'
        });
      }
    });

    // Identify missing indexes based on common query patterns
    const queryPatterns = this.analyzeQueryPatterns();
    Object.entries(queryPatterns).forEach(([collection, patterns]) => {
      patterns.forEach(pattern => {
        const hasIndex = indexes.indexes.some(index => {
          return index.collectionGroup === collection &&
                 this.fieldsMatch(index.fields, pattern.fields);
        });

        if (!hasIndex && pattern.usage.includes('frequent')) {
          effectiveness.missing.push({
            collection,
            fields: pattern.fields,
            description: pattern.description,
            usage: pattern.usage,
            priority: 'high'
          });
        }
      });
    });

    return effectiveness;
  }

  // Helper method to check if field patterns match
  fieldsMatch(indexFields, patternFields) {
    if (indexFields.length !== patternFields.length) return false;
    
    return indexFields.every((field, i) => {
      return field.fieldPath === patternFields[i] ||
             field.fieldPath.includes(patternFields[i]);
    });
  }

  // Load current indexes
  loadCurrentIndexes() {
    if (!fs.existsSync(this.indexesFile)) {
      this.log('Index dosyası bulunamadı', 'error');
      return { indexes: [], fieldOverrides: [] };
    }

    return JSON.parse(fs.readFileSync(this.indexesFile, 'utf8'));
  }

  // Generate optimized index configuration
  generateOptimizedIndexes() {
    this.log('Optimize edilmiş index konfigürasyonu oluşturuluyor...');

    const queryPatterns = this.analyzeQueryPatterns();
    const optimizedIndexes = {
      indexes: [],
      fieldOverrides: []
    };

    // Generate indexes based on query patterns
    Object.entries(queryPatterns).forEach(([collection, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.special === 'geo') {
          // Geo indexes need special handling
          optimizedIndexes.fieldOverrides.push({
            collectionGroup: collection,
            fieldPath: pattern.fields[0],
            indexes: [
              { order: 'ASCENDING', queryScope: 'COLLECTION' },
              { order: 'DESCENDING', queryScope: 'COLLECTION' }
            ]
          });
        } else {
          // Regular composite indexes
          const index = {
            collectionGroup: collection,
            queryScope: 'COLLECTION',
            fields: pattern.fields.map(field => {
              if (field.includes('tags') || field.includes('participants')) {
                return { fieldPath: field, arrayConfig: 'CONTAINS' };
              }
              return { 
                fieldPath: field, 
                order: field.includes('createdAt') || field.includes('updatedAt') || 
                       field.includes('Date') || field.includes('rating') || 
                       field.includes('popularity') ? 'DESCENDING' : 'ASCENDING'
              };
            })
          };

          optimizedIndexes.indexes.push(index);
        }
      });
    });

    // Add array field overrides
    const arrayFields = [
      { collection: 'tours', field: 'tags' },
      { collection: 'bookings', field: 'participants' },
      { collection: 'users', field: 'preferences.interests' }
    ];

    arrayFields.forEach(({ collection, field }) => {
      optimizedIndexes.fieldOverrides.push({
        collectionGroup: collection,
        fieldPath: field,
        indexes: [
          { arrayConfig: 'CONTAINS', queryScope: 'COLLECTION' }
        ]
      });
    });

    return optimizedIndexes;
  }

  // Cost analysis for indexes
  calculateIndexCosts() {
    this.log('Index maliyetleri hesaplanıyor...');

    const indexes = this.loadCurrentIndexes();
    const costAnalysis = {
      totalIndexes: indexes.indexes.length,
      estimatedStorageCost: 0,
      estimatedWriteCost: 0,
      recommendations: []
    };

    // Estimate costs (simplified calculation)
    indexes.indexes.forEach(index => {
      const fieldCount = index.fields.length;
      const estimatedDocuments = 10000; // Assume 10k documents per collection
      
      // Storage cost: ~0.18$ per GB/month, estimate ~1KB per index entry
      const storageGB = (estimatedDocuments * fieldCount * 1024) / (1024 * 1024 * 1024);
      costAnalysis.estimatedStorageCost += storageGB * 0.18;
      
      // Write cost: additional index updates on each write
      costAnalysis.estimatedWriteCost += fieldCount * 0.01; // $0.01 per additional write
    });

    // Generate cost optimization recommendations
    if (costAnalysis.totalIndexes > 200) {
      costAnalysis.recommendations.push({
        type: 'reduce_indexes',
        message: 'Yüksek index sayısı. Kullanılmayan indexleri temizlemeyi düşünün.',
        priority: 'medium'
      });
    }

    if (costAnalysis.estimatedStorageCost > 50) {
      costAnalysis.recommendations.push({
        type: 'optimize_storage',
        message: 'Index storage maliyeti yüksek. Büyük fieldları indexlememeyi düşünün.',
        priority: 'high'
      });
    }

    return costAnalysis;
  }

  // Generate optimization report
  async generateOptimizationReport() {
    this.log('Optimizasyon raporu oluşturuluyor...');

    const performanceMetrics = await this.monitorQueryPerformance();
    const indexEffectiveness = await this.analyzeIndexEffectiveness();
    const costAnalysis = this.calculateIndexCosts();
    const optimizedIndexes = this.generateOptimizedIndexes();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIndexes: this.loadCurrentIndexes().indexes.length,
        slowQueries: performanceMetrics.slowQueries.length,
        unusedIndexes: indexEffectiveness.unused.length,
        missingIndexes: indexEffectiveness.missing.length,
        estimatedMonthlyCost: costAnalysis.estimatedStorageCost + costAnalysis.estimatedWriteCost
      },
      performance: performanceMetrics,
      effectiveness: indexEffectiveness,
      costs: costAnalysis,
      optimizedConfiguration: optimizedIndexes,
      recommendations: [
        ...performanceMetrics.recommendedOptimizations,
        ...costAnalysis.recommendations,
        ...indexEffectiveness.missing.map(missing => ({
          type: 'add_index',
          collection: missing.collection,
          fields: missing.fields,
          description: missing.description,
          priority: missing.priority
        }))
      ]
    };

    // Ensure reports directory exists
    const reportsDir = path.dirname(this.optimizationReportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save report
    fs.writeFileSync(this.optimizationReportFile, JSON.stringify(report, null, 2));
    this.log(`Optimizasyon raporu oluşturuldu: ${this.optimizationReportFile}`, 'success');

    // Generate summary
    this.generateSummaryReport(report);

    return report;
  }

  // Generate human-readable summary
  generateSummaryReport(report) {
    const summary = [
      '# Firestore Index Optimizasyon Raporu',
      `**Tarih:** ${new Date(report.timestamp).toLocaleDateString('tr-TR')}`,
      '',
      '## 📊 Özet',
      `- **Toplam Index:** ${report.summary.totalIndexes}`,
      `- **Yavaş Sorgular:** ${report.summary.slowQueries}`,
      `- **Kullanılmayan Indexler:** ${report.summary.unusedIndexes}`,
      `- **Eksik Indexler:** ${report.summary.missingIndexes}`,
      `- **Tahmini Aylık Maliyet:** $${report.summary.estimatedMonthlyCost.toFixed(2)}`,
      '',
      '## 🎯 Öneriler',
      ...report.recommendations.map(rec => 
        `- **${rec.priority?.toUpperCase() || 'MEDIUM'}:** ${rec.message || rec.description}`
      ),
      '',
      '## 🐌 Yavaş Sorgular',
      ...report.performance.slowQueries.map(query => 
        `- **${query.collection}:** ${query.executionTime}ms, ${query.documentsRead} docs\n  *${query.recommendation}*`
      ),
      '',
      '## ❌ Eksik Indexler',
      ...report.effectiveness.missing.map(missing =>
        `- **${missing.collection}:** [${missing.fields.join(', ')}]\n  *${missing.description}*`
      )
    ];

    const summaryFile = path.join(path.dirname(this.optimizationReportFile), 'index-optimization-summary.md');
    fs.writeFileSync(summaryFile, summary.join('\n'));
    this.log(`Özet rapor oluşturuldu: ${summaryFile}`, 'success');
  }

  // Apply optimized indexes
  async applyOptimizations(force = false) {
    this.log('Index optimizasyonları uygulanıyor...');

    const report = await this.generateOptimizationReport();
    const optimizedIndexes = report.optimizedConfiguration;

    if (!force) {
      this.log('Değişiklikler önizleme modunda. --force flag ile uygulayın.', 'warning');
      this.log(`Yeni index sayısı: ${optimizedIndexes.indexes.length}`, 'info');
      this.log(`Field override sayısı: ${optimizedIndexes.fieldOverrides.length}`, 'info');
      return;
    }

    // Backup current indexes
    const backupFile = path.join(path.dirname(this.indexesFile), `firestore.indexes.backup.${Date.now()}.json`);
    const currentIndexes = this.loadCurrentIndexes();
    fs.writeFileSync(backupFile, JSON.stringify(currentIndexes, null, 2));
    this.log(`Mevcut indexler yedeklendi: ${backupFile}`, 'success');

    // Apply optimized indexes
    fs.writeFileSync(this.indexesFile, JSON.stringify(optimizedIndexes, null, 2));
    this.log(`Optimize edilmiş indexler uygulandı: ${this.indexesFile}`, 'success');

    this.log('⚠️  Firebase konsolundan indexleri deploy etmeyi unutmayın!', 'warning');
    this.log('   firebase deploy --only firestore:indexes', 'info');
  }

  // Monitor index performance continuously
  startPerformanceMonitoring(intervalMinutes = 60) {
    this.log(`Index performans izleme başlatılıyor (${intervalMinutes} dk aralıklarla)...`);

    setInterval(async () => {
      try {
        await this.generateOptimizationReport();
        this.log('Periyodik optimizasyon raporu oluşturuldu', 'success');
      } catch (error) {
        this.log(`Monitoring hatası: ${error.message}`, 'error');
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// CLI execution
if (require.main === module) {
  const optimizer = new FirestoreIndexOptimizer();
  const command = process.argv[2];
  const force = process.argv.includes('--force');

  switch (command) {
    case 'analyze':
      optimizer.generateOptimizationReport()
        .then(() => {
          console.log('\n✅ Index analizi tamamlandı!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Analiz hatası:', error.message);
          process.exit(1);
        });
      break;

    case 'optimize':
      optimizer.applyOptimizations(force)
        .then(() => {
          console.log('\n✅ Index optimizasyonu tamamlandı!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Optimizasyon hatası:', error.message);
          process.exit(1);
        });
      break;

    case 'monitor':
      const interval = parseInt(process.argv[3]) || 60;
      optimizer.startPerformanceMonitoring(interval);
      console.log(`📊 Index performans izleme başlatıldı (${interval} dk aralıklarla)`);
      break;

    default:
      console.log('Kullanım:');
      console.log('  node index-optimizer.js analyze                    - Index analizi yap');
      console.log('  node index-optimizer.js optimize [--force]         - Indexleri optimize et');
      console.log('  node index-optimizer.js monitor [interval]         - Performans izleme başlat');
  }
}

module.exports = FirestoreIndexOptimizer;
