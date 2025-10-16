const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecretsManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretsDir = path.join(__dirname, '../secrets');
    this.keyFile = path.join(this.secretsDir, '.master.key');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔐',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Generate master encryption key
  generateMasterKey() {
    if (fs.existsSync(this.keyFile)) {
      this.log('Master key zaten mevcut', 'warning');
      return;
    }

    const masterKey = crypto.randomBytes(32);
    
    // Ensure secrets directory exists
    if (!fs.existsSync(this.secretsDir)) {
      fs.mkdirSync(this.secretsDir, { recursive: true });
    }

    fs.writeFileSync(this.keyFile, masterKey.toString('hex'));
    fs.chmodSync(this.keyFile, 0o600); // Read/write for owner only
    
    this.log('Master key oluşturuldu', 'success');
    this.log('⚠️  Bu key\'i güvenli yerde saklayın!', 'warning');
  }

  // Get master key
  getMasterKey() {
    if (!fs.existsSync(this.keyFile)) {
      throw new Error('Master key bulunamadı. Önce generateMasterKey() çalıştırın.');
    }

    return Buffer.from(fs.readFileSync(this.keyFile, 'utf8'), 'hex');
  }

  // Encrypt data
  encrypt(text) {
    try {
      const masterKey = this.getMasterKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, masterKey);
      cipher.setAAD(Buffer.from('tourtrip-secrets'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Şifreleme hatası: ${error.message}`);
    }
  }

  // Decrypt data
  decrypt(encryptedData) {
    try {
      const masterKey = this.getMasterKey();
      const decipher = crypto.createDecipher(this.algorithm, masterKey);
      
      decipher.setAAD(Buffer.from('tourtrip-secrets'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Şifre çözme hatası: ${error.message}`);
    }
  }

  // Store secret
  storeSecret(name, value, environment = 'all') {
    this.log(`Secret saklıanıyor: ${name} (${environment})`);

    const secretData = {
      name,
      environment,
      value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const encrypted = this.encrypt(JSON.stringify(secretData));
    
    const secretFile = path.join(this.secretsDir, `${name}.${environment}.secret`);
    fs.writeFileSync(secretFile, JSON.stringify(encrypted, null, 2));
    fs.chmodSync(secretFile, 0o600);
    
    this.log(`Secret başarıyla saklandı: ${secretFile}`, 'success');
  }

  // Retrieve secret
  retrieveSecret(name, environment = 'all') {
    const secretFile = path.join(this.secretsDir, `${name}.${environment}.secret`);
    
    if (!fs.existsSync(secretFile)) {
      throw new Error(`Secret bulunamadı: ${name} (${environment})`);
    }

    const encryptedData = JSON.parse(fs.readFileSync(secretFile, 'utf8'));
    const decryptedJson = this.decrypt(encryptedData);
    const secretData = JSON.parse(decryptedJson);
    
    return secretData.value;
  }

  // List all secrets
  listSecrets() {
    if (!fs.existsSync(this.secretsDir)) {
      return [];
    }

    const secretFiles = fs.readdirSync(this.secretsDir)
      .filter(file => file.endsWith('.secret'));

    return secretFiles.map(file => {
      const [name, environment] = file.replace('.secret', '').split('.');
      return { name, environment, file };
    });
  }

  // Delete secret
  deleteSecret(name, environment = 'all') {
    const secretFile = path.join(this.secretsDir, `${name}.${environment}.secret`);
    
    if (!fs.existsSync(secretFile)) {
      throw new Error(`Secret bulunamadı: ${name} (${environment})`);
    }

    fs.unlinkSync(secretFile);
    this.log(`Secret silindi: ${name} (${environment})`, 'success');
  }

  // Generate environment secrets
  generateEnvironmentSecrets(environment) {
    this.log(`${environment} ortamı için secrets oluşturuluyor...`);

    const secrets = {
      // Firebase secrets
      firebase: {
        apiKey: this.generateRandomSecret(40),
        appId: `1:${this.generateRandomNumber(12)}:web:${this.generateRandomSecret(40)}`,
        measurementId: `G-${this.generateRandomSecret(10).toUpperCase()}`,
        messagingSenderId: this.generateRandomNumber(12),
        appCheckSiteKey: this.generateRandomSecret(40)
      },

      // Database secrets
      database: {
        connectionString: `postgresql://user:${this.generateRandomSecret(32)}@db-${environment}.tourtrip.app:5432/tourtrip`,
        readOnlyConnectionString: `postgresql://readonly:${this.generateRandomSecret(32)}@db-${environment}.tourtrip.app:5432/tourtrip`
      },

      // API secrets
      api: {
        jwtSecret: this.generateRandomSecret(64),
        encryptionKey: this.generateRandomSecret(32),
        rateLimitSecret: this.generateRandomSecret(32)
      },

      // External service secrets
      external: {
        googleMapsApiKey: `AIza${this.generateRandomSecret(35)}`,
        sendgridApiKey: `SG.${this.generateRandomSecret(66)}`,
        stripeSecretKey: `sk_${environment === 'production' ? 'live' : 'test'}_${this.generateRandomSecret(60)}`,
        stripePublishableKey: `pk_${environment === 'production' ? 'live' : 'test'}_${this.generateRandomSecret(60)}`,
        stripeWebhookSecret: `whsec_${this.generateRandomSecret(32)}`,
        twilioAccountSid: `AC${this.generateRandomSecret(32)}`,
        twilioAuthToken: this.generateRandomSecret(32),
        mailgunApiKey: `key-${this.generateRandomSecret(32)}`,
        mailgunDomain: `${environment}.mail.tourtrip.app`
      },

      // Monitoring secrets
      monitoring: {
        sentryDsn: `https://${this.generateRandomSecret(32)}@o123456.ingest.sentry.io/123456`,
        datadogApiKey: this.generateRandomSecret(32),
        datadogAppKey: this.generateRandomSecret(40),
        mixpanelToken: this.generateRandomSecret(32)
      },

      // Deployment secrets
      deployment: {
        githubToken: `ghp_${this.generateRandomSecret(36)}`,
        dockerRegistryPassword: this.generateRandomSecret(32),
        kubernetesSecret: this.generateRandomSecret(64)
      }
    };

    // Store each secret
    Object.entries(secrets).forEach(([category, categorySecrets]) => {
      Object.entries(categorySecrets).forEach(([key, value]) => {
        const secretName = `${category}_${key}`;
        this.storeSecret(secretName, value, environment);
      });
    });

    this.log(`${environment} ortamı secrets oluşturuldu`, 'success');
    return secrets;
  }

  // Generate random secret
  generateRandomSecret(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Generate random number
  generateRandomNumber(length) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Export secrets for environment
  exportSecretsToEnv(environment) {
    this.log(`${environment} için environment dosyası oluşturuluyor...`);

    const secrets = this.listSecrets()
      .filter(secret => secret.environment === environment || secret.environment === 'all');

    const envLines = [
      `# TourTrip.app Secrets - ${environment.toUpperCase()}`,
      `# Generated: ${new Date().toISOString()}`,
      `# DO NOT COMMIT THIS FILE TO VERSION CONTROL`,
      ''
    ];

    secrets.forEach(secret => {
      try {
        const value = this.retrieveSecret(secret.name, secret.environment);
        const envVarName = secret.name.toUpperCase();
        envLines.push(`${envVarName}=${value}`);
      } catch (error) {
        this.log(`Secret okunamadı: ${secret.name}`, 'warning');
      }
    });

    const envContent = envLines.join('\n');
    const envFile = path.join(this.secretsDir, `.env.secrets.${environment}`);
    
    fs.writeFileSync(envFile, envContent);
    fs.chmodSync(envFile, 0o600);
    
    this.log(`Environment dosyası oluşturuldu: ${envFile}`, 'success');
    return envFile;
  }

  // Backup secrets
  backupSecrets() {
    this.log('Secrets yedekleniyor...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.secretsDir, 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const secrets = this.listSecrets();
    const backupData = {
      timestamp,
      secrets: {}
    };

    secrets.forEach(secret => {
      try {
        const value = this.retrieveSecret(secret.name, secret.environment);
        backupData.secrets[`${secret.name}.${secret.environment}`] = value;
      } catch (error) {
        this.log(`Secret yedeklenemedi: ${secret.name}`, 'warning');
      }
    });

    const encrypted = this.encrypt(JSON.stringify(backupData));
    const backupFile = path.join(backupDir, 'secrets-backup.json');
    
    fs.writeFileSync(backupFile, JSON.stringify(encrypted, null, 2));
    fs.chmodSync(backupFile, 0o600);
    
    this.log(`Secrets yedeklendi: ${backupFile}`, 'success');
    return backupFile;
  }

  // Restore secrets from backup
  restoreSecrets(backupFile) {
    this.log(`Secrets geri yükleniyor: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error('Yedek dosyası bulunamadı');
    }

    const encryptedData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const decryptedJson = this.decrypt(encryptedData);
    const backupData = JSON.parse(decryptedJson);

    Object.entries(backupData.secrets).forEach(([key, value]) => {
      const [name, environment] = key.split('.');
      this.storeSecret(name, value, environment);
    });

    this.log('Secrets başarıyla geri yüklendi', 'success');
  }

  // Rotate secrets
  rotateSecret(name, environment = 'all') {
    this.log(`Secret döndürülüyor: ${name} (${environment})`);

    // Generate new secret based on type
    let newValue;
    if (name.includes('key') || name.includes('secret')) {
      newValue = this.generateRandomSecret(64);
    } else if (name.includes('token')) {
      newValue = this.generateRandomSecret(40);
    } else {
      newValue = this.generateRandomSecret(32);
    }

    // Store old value as backup
    try {
      const oldValue = this.retrieveSecret(name, environment);
      this.storeSecret(`${name}_old`, oldValue, environment);
    } catch (error) {
      // Secret doesn't exist, that's okay
    }

    // Store new value
    this.storeSecret(name, newValue, environment);
    
    this.log(`Secret başarıyla döndürüldü: ${name}`, 'success');
    return newValue;
  }
}

// CLI execution
if (require.main === module) {
  const manager = new SecretsManager();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (command) {
      case 'init':
        manager.generateMasterKey();
        break;
        
      case 'generate':
        if (!arg1) {
          console.error('Environment belirtilmeli: development, staging, production');
          process.exit(1);
        }
        manager.generateEnvironmentSecrets(arg1);
        break;
        
      case 'list':
        const secrets = manager.listSecrets();
        console.log('Mevcut secrets:');
        secrets.forEach(secret => {
          console.log(`  ${secret.name} (${secret.environment})`);
        });
        break;
        
      case 'export':
        if (!arg1) {
          console.error('Environment belirtilmeli');
          process.exit(1);
        }
        manager.exportSecretsToEnv(arg1);
        break;
        
      case 'backup':
        manager.backupSecrets();
        break;
        
      case 'restore':
        if (!arg1) {
          console.error('Backup dosyası belirtilmeli');
          process.exit(1);
        }
        manager.restoreSecrets(arg1);
        break;
        
      case 'rotate':
        if (!arg1) {
          console.error('Secret adı belirtilmeli');
          process.exit(1);
        }
        manager.rotateSecret(arg1, arg2 || 'all');
        break;
        
      default:
        console.log('Kullanım:');
        console.log('  node secrets-manager.js init                    - Master key oluştur');
        console.log('  node secrets-manager.js generate <env>          - Environment secrets oluştur');
        console.log('  node secrets-manager.js list                    - Tüm secrets listele');
        console.log('  node secrets-manager.js export <env>            - Environment dosyası oluştur');
        console.log('  node secrets-manager.js backup                  - Secrets yedekle');
        console.log('  node secrets-manager.js restore <file>          - Secrets geri yükle');
        console.log('  node secrets-manager.js rotate <name> [env]     - Secret döndür');
    }
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

module.exports = SecretsManager;
