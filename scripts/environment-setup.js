const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentManager {
  constructor() {
    this.environments = ['development', 'staging', 'production'];
    this.configDir = path.join(__dirname, '../config');
    this.secretsDir = path.join(__dirname, '../secrets');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Environment Configuration Management
  generateEnvironmentConfig(environment) {
    this.log(`${environment} ortamı için konfigürasyon oluşturuluyor...`);

    const baseConfig = {
      // Firebase Configuration
      firebase: {
        apiKey: this.generateSecret(`FIREBASE_API_KEY_${environment.toUpperCase()}`),
        authDomain: `tourtrip-${environment}.firebaseapp.com`,
        projectId: `tourtrip-${environment}`,
        storageBucket: `tourtrip-${environment}.appspot.com`,
        messagingSenderId: this.generateSecret(`FIREBASE_MESSAGING_SENDER_ID_${environment.toUpperCase()}`),
        appId: this.generateSecret(`FIREBASE_APP_ID_${environment.toUpperCase()}`),
        measurementId: environment === 'production' ? this.generateSecret('GA4_MEASUREMENT_ID') : null
      },

      // Application Configuration
      app: {
        name: `TourTrip ${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
        url: this.getAppUrl(environment),
        version: process.env.npm_package_version || '1.0.0',
        environment,
        debugMode: environment !== 'production',
        logLevel: environment === 'production' ? 'error' : 'debug'
      },

      // API Configuration
      api: {
        baseUrl: this.getApiUrl(environment),
        timeout: environment === 'production' ? 30000 : 10000,
        retryAttempts: environment === 'production' ? 3 : 1,
        rateLimiting: {
          enabled: environment === 'production',
          maxRequests: environment === 'production' ? 100 : 1000,
          windowMs: 15 * 60 * 1000 // 15 minutes
        }
      },

      // Security Configuration
      security: {
        appCheck: {
          enabled: environment === 'production',
          siteKey: this.generateSecret(`FIREBASE_APP_CHECK_SITE_KEY_${environment.toUpperCase()}`)
        },
        encryption: {
          key: this.generateSecret(`ENCRYPTION_KEY_${environment.toUpperCase()}`),
          algorithm: 'aes-256-gcm'
        },
        jwt: {
          secret: this.generateSecret(`JWT_SECRET_${environment.toUpperCase()}`),
          expiresIn: environment === 'production' ? '1h' : '24h'
        },
        cors: {
          origin: this.getCorsOrigins(environment),
          credentials: true
        }
      },

      // Database Configuration
      database: {
        connectionPooling: environment === 'production',
        maxConnections: environment === 'production' ? 100 : 10,
        queryTimeout: environment === 'production' ? 30000 : 5000,
        enableLogging: environment !== 'production'
      },

      // Cache Configuration
      cache: {
        redis: {
          enabled: environment === 'production',
          url: this.generateSecret(`REDIS_URL_${environment.toUpperCase()}`),
          ttl: environment === 'production' ? 3600 : 300
        },
        memory: {
          maxSize: environment === 'production' ? '100mb' : '50mb',
          ttl: 600
        }
      },

      // External Services
      services: {
        googleMaps: {
          apiKey: this.generateSecret(`GOOGLE_MAPS_API_KEY_${environment.toUpperCase()}`),
          libraries: ['places', 'geometry']
        },
        email: {
          sendgrid: {
            apiKey: this.generateSecret(`SENDGRID_API_KEY_${environment.toUpperCase()}`),
            fromEmail: `noreply@${this.getAppDomain(environment)}`
          },
          templates: {
            welcome: environment === 'production' ? 'd-prod-welcome' : 'd-dev-welcome',
            booking: environment === 'production' ? 'd-prod-booking' : 'd-dev-booking',
            reset: environment === 'production' ? 'd-prod-reset' : 'd-dev-reset'
          }
        },
        analytics: {
          ga4: {
            measurementId: this.generateSecret(`GA4_MEASUREMENT_ID_${environment.toUpperCase()}`),
            enabled: environment === 'production'
          },
          mixpanel: {
            token: this.generateSecret(`MIXPANEL_TOKEN_${environment.toUpperCase()}`),
            enabled: environment === 'production'
          }
        },
        monitoring: {
          sentry: {
            dsn: this.generateSecret(`SENTRY_DSN_${environment.toUpperCase()}`),
            enabled: environment !== 'development',
            sampleRate: environment === 'production' ? 0.1 : 1.0
          }
        }
      },

      // Feature Flags
      features: {
        socialLogin: true,
        paymentProcessing: environment !== 'development',
        advancedAnalytics: environment === 'production',
        betaFeatures: environment === 'staging',
        debugPanel: environment !== 'production'
      },

      // Performance Configuration
      performance: {
        bundleSizeLimit: environment === 'production' ? '500kb' : '1mb',
        chunkSizeLimit: environment === 'production' ? '100kb' : '200kb',
        enableSWR: true,
        enableServiceWorker: environment !== 'development',
        coreWebVitals: {
          lcp: environment === 'production' ? 2500 : 4000,
          fid: environment === 'production' ? 100 : 300,
          cls: environment === 'production' ? 0.1 : 0.25
        }
      }
    };

    return baseConfig;
  }

  // Helper methods for URL generation
  getAppUrl(environment) {
    switch (environment) {
      case 'production':
        return 'https://tourtrip.app';
      case 'staging':
        return 'https://tourtrip-staging.web.app';
      default:
        return 'http://localhost:3000';
    }
  }

  getApiUrl(environment) {
    switch (environment) {
      case 'production':
        return 'https://api.tourtrip.app';
      case 'staging':
        return 'https://tourtrip-staging.web.app/api';
      default:
        return 'http://localhost:3000/api';
    }
  }

  getAppDomain(environment) {
    switch (environment) {
      case 'production':
        return 'tourtrip.app';
      case 'staging':
        return 'staging.tourtrip.app';
      default:
        return 'localhost';
    }
  }

  getCorsOrigins(environment) {
    switch (environment) {
      case 'production':
        return ['https://tourtrip.app', 'https://www.tourtrip.app'];
      case 'staging':
        return ['https://tourtrip-staging.web.app', 'https://staging.tourtrip.app'];
      default:
        return ['http://localhost:3000', 'http://localhost:5000'];
    }
  }

  generateSecret(name) {
    // In real implementation, these would be actual secrets
    // For now, return placeholder values
    return `${name}_${crypto.randomBytes(8).toString('hex')}`;
  }

  // Environment file generation
  generateEnvFile(environment, config) {
    this.log(`${environment} için .env dosyası oluşturuluyor...`);

    const envLines = [
      '# TourTrip.app Environment Configuration',
      `# Environment: ${environment}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      '# Firebase Configuration',
      `NEXT_PUBLIC_FIREBASE_API_KEY=${config.firebase.apiKey}`,
      `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.firebase.authDomain}`,
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.firebase.projectId}`,
      `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.firebase.storageBucket}`,
      `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.firebase.messagingSenderId}`,
      `NEXT_PUBLIC_FIREBASE_APP_ID=${config.firebase.appId}`,
      config.firebase.measurementId ? `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${config.firebase.measurementId}` : '',
      '',
      '# Application Configuration',
      `NEXT_PUBLIC_APP_NAME="${config.app.name}"`,
      `NEXT_PUBLIC_APP_URL=${config.app.url}`,
      `NEXT_PUBLIC_APP_VERSION=${config.app.version}`,
      `NEXT_PUBLIC_ENVIRONMENT=${config.app.environment}`,
      `NEXT_PUBLIC_DEBUG_MODE=${config.app.debugMode}`,
      `LOG_LEVEL=${config.app.logLevel}`,
      '',
      '# API Configuration',
      `NEXT_PUBLIC_API_BASE_URL=${config.api.baseUrl}`,
      `API_TIMEOUT=${config.api.timeout}`,
      `API_RETRY_ATTEMPTS=${config.api.retryAttempts}`,
      `RATE_LIMIT_MAX_REQUESTS=${config.api.rateLimiting.maxRequests}`,
      `RATE_LIMIT_WINDOW_MS=${config.api.rateLimiting.windowMs}`,
      '',
      '# Security Configuration',
      `NEXT_PUBLIC_FIREBASE_APP_CHECK_ENABLED=${config.security.appCheck.enabled}`,
      config.security.appCheck.siteKey ? `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=${config.security.appCheck.siteKey}` : '',
      `ENCRYPTION_KEY=${config.security.encryption.key}`,
      `JWT_SECRET=${config.security.jwt.secret}`,
      `JWT_EXPIRES_IN=${config.security.jwt.expiresIn}`,
      '',
      '# External Services',
      `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${config.services.googleMaps.apiKey}`,
      `SENDGRID_API_KEY=${config.services.email.sendgrid.apiKey}`,
      `SENDGRID_FROM_EMAIL=${config.services.email.sendgrid.fromEmail}`,
      config.services.analytics.ga4.measurementId ? `NEXT_PUBLIC_GA4_MEASUREMENT_ID=${config.services.analytics.ga4.measurementId}` : '',
      config.services.monitoring.sentry.dsn ? `SENTRY_DSN=${config.services.monitoring.sentry.dsn}` : '',
      '',
      '# Feature Flags',
      `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=${config.features.socialLogin}`,
      `NEXT_PUBLIC_ENABLE_PAYMENT_PROCESSING=${config.features.paymentProcessing}`,
      `NEXT_PUBLIC_ENABLE_ANALYTICS=${config.features.advancedAnalytics}`,
      `NEXT_PUBLIC_ENABLE_BETA_FEATURES=${config.features.betaFeatures}`,
      `NEXT_PUBLIC_ENABLE_DEBUG_PANEL=${config.features.debugPanel}`,
      '',
      '# Performance Configuration',
      `BUNDLE_SIZE_LIMIT=${config.performance.bundleSizeLimit}`,
      `CHUNK_SIZE_LIMIT=${config.performance.chunkSizeLimit}`,
      `NEXT_PUBLIC_ENABLE_SWR=${config.performance.enableSWR}`,
      `NEXT_PUBLIC_ENABLE_SERVICE_WORKER=${config.performance.enableServiceWorker}`,
      '',
      '# Cache Configuration',
      config.cache.redis.url ? `REDIS_URL=${config.cache.redis.url}` : '',
      `CACHE_TTL=${config.cache.redis.ttl}`,
      `MEMORY_CACHE_MAX_SIZE=${config.cache.memory.maxSize}`,
      `MEMORY_CACHE_TTL=${config.cache.memory.ttl}`
    ].filter(line => line !== ''); // Remove empty lines from conditionals

    return envLines.join('\n');
  }

  // Secrets management
  generateSecretsFile(environment) {
    this.log(`${environment} için secrets dosyası oluşturuluyor...`);

    const secrets = {
      environment,
      generatedAt: new Date().toISOString(),
      secrets: {
        database: {
          connectionString: this.generateSecret(`DB_CONNECTION_${environment.toUpperCase()}`),
          readOnlyConnectionString: this.generateSecret(`DB_READONLY_CONNECTION_${environment.toUpperCase()}`)
        },
        redis: {
          url: this.generateSecret(`REDIS_URL_${environment.toUpperCase()}`),
          password: this.generateSecret(`REDIS_PASSWORD_${environment.toUpperCase()}`)
        },
        external: {
          stripeSecret: this.generateSecret(`STRIPE_SECRET_${environment.toUpperCase()}`),
          stripeWebhookSecret: this.generateSecret(`STRIPE_WEBHOOK_SECRET_${environment.toUpperCase()}`),
          twilioAuthToken: this.generateSecret(`TWILIO_AUTH_TOKEN_${environment.toUpperCase()}`),
          mailgunApiKey: this.generateSecret(`MAILGUN_API_KEY_${environment.toUpperCase()}`)
        },
        monitoring: {
          sentryDsn: this.generateSecret(`SENTRY_DSN_${environment.toUpperCase()}`),
          datadogApiKey: this.generateSecret(`DATADOG_API_KEY_${environment.toUpperCase()}`)
        }
      },
      deployment: {
        githubToken: this.generateSecret(`GITHUB_TOKEN_${environment.toUpperCase()}`),
        firebaseServiceAccount: `service-account-${environment}.json`
      }
    };

    return secrets;
  }

  // Main setup method
  async setupEnvironment(environment) {
    try {
      this.log(`${environment} ortamı kurulumu başlatılıyor...`);

      // Create directories if they don't exist
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      if (!fs.existsSync(this.secretsDir)) {
        fs.mkdirSync(this.secretsDir, { recursive: true });
      }

      // Generate configuration
      const config = this.generateEnvironmentConfig(environment);
      
      // Generate environment file
      const envContent = this.generateEnvFile(environment, config);
      const envPath = path.join(this.configDir, `.env.${environment}`);
      fs.writeFileSync(envPath, envContent);
      this.log(`Environment dosyası oluşturuldu: ${envPath}`, 'success');

      // Generate secrets file
      const secrets = this.generateSecretsFile(environment);
      const secretsPath = path.join(this.secretsDir, `secrets.${environment}.json`);
      fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
      this.log(`Secrets dosyası oluşturuldu: ${secretsPath}`, 'success');

      // Generate Firebase project configuration
      const firebaseConfig = {
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
        locationId: 'europe-west1',
        functions: {
          runtime: 'nodejs20',
          memory: environment === 'production' ? '1GB' : '512MB',
          timeout: environment === 'production' ? '540s' : '60s'
        },
        firestore: {
          rules: `firestore.${environment}.rules`,
          indexes: 'firestore.indexes.json'
        },
        storage: {
          rules: `storage.${environment}.rules`
        },
        hosting: {
          public: 'out',
          target: environment === 'production' ? 'production' : environment,
          cleanUrls: true,
          trailingSlash: false
        }
      };

      const firebaseConfigPath = path.join(this.configDir, `firebase.${environment}.json`);
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
      this.log(`Firebase konfigürasyonu oluşturuldu: ${firebaseConfigPath}`, 'success');

      // Generate deployment target configuration
      const deploymentConfig = {
        environment,
        targets: {
          functions: [`functions-${environment}`],
          hosting: [`hosting-${environment}`],
          firestore: [`firestore-${environment}`],
          storage: [`storage-${environment}`]
        },
        aliases: {
          default: environment === 'production' ? 'tourtrip-prod' : `tourtrip-${environment}`
        },
        hooks: {
          predeploy: [
            'npm run build',
            'npm run test:unit'
          ],
          postdeploy: [
            'npm run test:smoke',
            'npm run notify:deployment'
          ]
        }
      };

      const deploymentConfigPath = path.join(this.configDir, `deployment.${environment}.json`);
      fs.writeFileSync(deploymentConfigPath, JSON.stringify(deploymentConfig, null, 2));
      this.log(`Deployment konfigürasyonu oluşturuldu: ${deploymentConfigPath}`, 'success');

      this.log(`${environment} ortamı başarıyla kuruldu!`, 'success');
      return { config, secrets, envPath, secretsPath };

    } catch (error) {
      this.log(`${environment} ortamı kurulumu başarısız: ${error.message}`, 'error');
      throw error;
    }
  }

  // Setup all environments
  async setupAllEnvironments() {
    this.log('Tüm ortamlar için konfigürasyon oluşturuluyor...');

    const results = {};

    for (const environment of this.environments) {
      try {
        results[environment] = await this.setupEnvironment(environment);
      } catch (error) {
        this.log(`${environment} ortamı kurulumu başarısız`, 'error');
        results[environment] = { error: error.message };
      }
    }

    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      environments: this.environments,
      results,
      instructions: {
        usage: 'Ortam dosyalarını kullanmak için:',
        commands: [
          'cp config/.env.development .env.local  # Development için',
          'cp config/.env.staging .env.local      # Staging için',
          'cp config/.env.production .env.local   # Production için'
        ],
        security: 'secrets/ klasöründeki dosyalar gizli tutulmalı ve versiyon kontrolüne eklenmemeli'
      }
    };

    const summaryPath = path.join(this.configDir, 'setup-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    this.log('Tüm ortamlar başarıyla kuruldu!', 'success');
    this.log(`Özet rapor: ${summaryPath}`, 'success');

    return summary;
  }
}

// CLI execution
if (require.main === module) {
  const manager = new EnvironmentManager();
  const environment = process.argv[2];

  if (environment && manager.environments.includes(environment)) {
    manager.setupEnvironment(environment)
      .then(() => {
        console.log(`\n✅ ${environment} ortamı başarıyla kuruldu!`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`\n❌ ${environment} ortamı kurulumu başarısız:`, error.message);
        process.exit(1);
      });
  } else {
    manager.setupAllEnvironments()
      .then(() => {
        console.log('\n✅ Tüm ortamlar başarıyla kuruldu!');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Ortam kurulumu başarısız:', error.message);
        process.exit(1);
      });
  }
}

module.exports = EnvironmentManager;
