const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class StagingDeployment {
  constructor() {
    this.environment = 'staging';
    this.projectId = 'tourtrip-staging';
    this.deploymentId = `staging-${Date.now()}`;
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

  async validateEnvironment() {
    this.log('Staging ortamı doğrulanıyor...');
    
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      this.log('Firebase CLI bulundu', 'success');
    } catch (error) {
      throw new Error('Firebase CLI yüklü değil');
    }

    // Check if staging project exists
    try {
      execSync(`firebase use ${this.projectId}`, { stdio: 'pipe' });
      this.log(`Firebase projesi ${this.projectId} aktif`, 'success');
    } catch (error) {
      throw new Error(`Firebase projesi ${this.projectId} bulunamadı`);
    }

    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Eksik ortam değişkenleri: ${missingVars.join(', ')}`);
    }

    this.log('Ortam değişkenleri doğrulandı', 'success');
  }

  async prepareStagingData() {
    this.log('Staging verisi hazırlanıyor...');
    
    const stagingData = {
      users: [
        {
          id: 'staging-admin',
          email: 'admin@staging.tourtrip.app',
          role: 'admin',
          displayName: 'Staging Admin',
          isActive: true,
          createdAt: new Date(),
          profile: {
            firstName: 'Staging',
            lastName: 'Admin'
          }
        },
        {
          id: 'staging-tester',
          email: 'tester@staging.tourtrip.app',
          role: 'staging_tester',
          displayName: 'Staging Tester',
          isActive: true,
          createdAt: new Date(),
          profile: {
            firstName: 'Staging',
            lastName: 'Tester'
          }
        }
      ],
      tours: [
        {
          id: 'staging-tour-1',
          title: 'Staging Test Turu - İstanbul',
          description: 'Staging ortamı için test turu',
          location: {
            name: 'İstanbul, Türkiye',
            coordinates: {
              latitude: 41.0082,
              longitude: 28.9784
            }
          },
          price: {
            amount: 100,
            currency: 'TRY'
          },
          duration: { hours: 2, days: 0 },
          maxParticipants: 5,
          currentParticipants: 0,
          category: 'cultural',
          isActive: true,
          createdAt: new Date(),
          tags: ['test', 'staging', 'istanbul']
        }
      ],
      settings: {
        environment: 'staging',
        debugMode: true,
        testDataEnabled: true,
        mockPayments: true,
        stagingFeatures: {
          advancedLogging: true,
          testUserAccess: true,
          debugAPI: true
        }
      }
    };

    // Write staging data to file
    const dataPath = path.join(__dirname, '../staging-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(stagingData, null, 2));
    
    this.log('Staging verisi hazırlandı', 'success');
    return stagingData;
  }

  async buildApplication() {
    this.log('Uygulama build ediliyor...');
    
    try {
      // Set environment for staging
      process.env.NODE_ENV = 'staging';
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'staging';
      
      execSync('npm run build', { 
        stdio: 'inherit',
        env: { 
          ...process.env,
          NODE_ENV: 'staging'
        }
      });
      
      this.log('Build tamamlandı', 'success');
    } catch (error) {
      throw new Error('Build işlemi başarısız: ' + error.message);
    }
  }

  async deployFunctions() {
    this.log('Cloud Functions deploy ediliyor...');
    
    try {
      execSync(`firebase deploy --only functions --project ${this.projectId}`, {
        stdio: 'inherit'
      });
      
      this.log('Functions deploy tamamlandı', 'success');
    } catch (error) {
      throw new Error('Functions deploy başarısız: ' + error.message);
    }
  }

  async deployFirestore() {
    this.log('Firestore rules deploy ediliyor...');
    
    try {
      execSync(`firebase deploy --only firestore:rules,firestore:indexes --project ${this.projectId}`, {
        stdio: 'inherit'
      });
      
      this.log('Firestore deploy tamamlandı', 'success');
    } catch (error) {
      throw new Error('Firestore deploy başarısız: ' + error.message);
    }
  }

  async deployHosting() {
    this.log('Hosting deploy ediliyor...');
    
    try {
      execSync(`firebase deploy --only hosting --project ${this.projectId}`, {
        stdio: 'inherit'
      });
      
      this.log('Hosting deploy tamamlandı', 'success');
    } catch (error) {
      throw new Error('Hosting deploy başarısız: ' + error.message);
    }
  }

  async deployStorage() {
    this.log('Storage rules deploy ediliyor...');
    
    try {
      execSync(`firebase deploy --only storage --project ${this.projectId}`, {
        stdio: 'inherit'
      });
      
      this.log('Storage deploy tamamlandı', 'success');
    } catch (error) {
      throw new Error('Storage deploy başarısız: ' + error.message);
    }
  }

  async runSmokeTests() {
    this.log('Smoke testler çalıştırılıyor...');
    
    const stagingUrl = `https://${this.projectId}.web.app`;
    
    try {
      // Basic connectivity test
      const response = await fetch(stagingUrl);
      if (!response.ok) {
        throw new Error(`Staging site erişilemez: ${response.status}`);
      }
      
      this.log('Staging site erişilebilir', 'success');
      
      // API health check
      const healthCheck = await fetch(`${stagingUrl}/api/health`);
      if (healthCheck.ok) {
        this.log('API health check başarılı', 'success');
      } else {
        this.log('API health check başarısız', 'warning');
      }
      
    } catch (error) {
      this.log(`Smoke test başarısız: ${error.message}`, 'error');
      throw error;
    }
  }

  async createDeploymentRecord() {
    this.log('Deployment kaydı oluşturuluyor...');
    
    const deploymentRecord = {
      id: this.deploymentId,
      environment: this.environment,
      projectId: this.projectId,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      gitCommit: this.getGitCommit(),
      deployedBy: process.env.USER || 'unknown',
      status: 'completed',
      services: ['functions', 'firestore', 'hosting', 'storage'],
      url: `https://${this.projectId}.web.app`
    };

    // Save deployment record
    const recordPath = path.join(__dirname, `../deployments/staging-${this.deploymentId}.json`);
    
    // Ensure deployments directory exists
    const deploymentsDir = path.dirname(recordPath);
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    this.log(`Deployment kaydı oluşturuldu: ${recordPath}`, 'success');
    return deploymentRecord;
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async deploy() {
    const startTime = Date.now();
    
    try {
      this.log(`Staging deployment başlatılıyor: ${this.deploymentId}`);
      
      await this.validateEnvironment();
      await this.prepareStagingData();
      await this.buildApplication();
      
      // Deploy in order
      await this.deployFirestore();
      await this.deployStorage();
      await this.deployFunctions();
      await this.deployHosting();
      
      await this.runSmokeTests();
      
      const deploymentRecord = await this.createDeploymentRecord();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      this.log(`🎉 Staging deployment tamamlandı! (${duration}s)`, 'success');
      this.log(`📱 Staging URL: ${deploymentRecord.url}`, 'success');
      this.log(`🆔 Deployment ID: ${this.deploymentId}`, 'success');
      
      return deploymentRecord;
      
    } catch (error) {
      this.log(`Deployment başarısız: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const deployment = new StagingDeployment();
  
  deployment.deploy()
    .then(record => {
      console.log('\n✅ Staging deployment başarıyla tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Staging deployment başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = StagingDeployment;
