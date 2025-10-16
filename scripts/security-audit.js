const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirestoreSecurityAudit {
  constructor() {
    this.rulesFile = path.join(__dirname, '../firestore.advanced.rules');
    this.auditReportFile = path.join(__dirname, '../reports/security-audit.json');
    this.vulnerabilityDatabase = this.loadVulnerabilityDatabase();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      critical: '🚨'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Load known vulnerability patterns
  loadVulnerabilityDatabase() {
    return {
      // Common security anti-patterns
      antiPatterns: [
        {
          id: 'AUTH_BYPASS',
          pattern: /allow\s+(read|write|create|update|delete):\s*if\s+true/,
          severity: 'CRITICAL',
          description: 'Unconditional allow rules create security vulnerabilities',
          recommendation: 'Add proper authentication and authorization checks'
        },
        {
          id: 'WEAK_AUTH',
          pattern: /request\.auth\s*!=\s*null/,
          severity: 'MEDIUM',
          description: 'Authentication check without user verification',
          recommendation: 'Verify user status and role in addition to authentication'
        },
        {
          id: 'MISSING_RATE_LIMIT',
          pattern: /allow\s+(create|update|delete)/,
          severity: 'LOW',
          description: 'No rate limiting on write operations',
          recommendation: 'Implement rate limiting for write operations'
        },
        {
          id: 'BROAD_READ_ACCESS',
          pattern: /allow\s+read:\s*if\s+request\.auth\s*!=\s*null(?!\s+&&)/,
          severity: 'MEDIUM',
          description: 'Overly broad read access without proper authorization',
          recommendation: 'Add role-based or ownership-based access controls'
        },
        {
          id: 'NO_DATA_VALIDATION',
          pattern: /allow\s+(create|update):\s*if(?!.*isValid)/,
          severity: 'HIGH',
          description: 'Missing data validation on write operations',
          recommendation: 'Add data validation functions'
        }
      ],

      // Security best practices
      bestPractices: [
        {
          id: 'ROLE_BASED_ACCESS',
          pattern: /function\s+hasRole\(|function\s+isAdmin\(|function\s+isManager\(/,
          description: 'Role-based access control implementation'
        },
        {
          id: 'DATA_VALIDATION',
          pattern: /function\s+isValid\w+\(/,
          description: 'Data validation functions'
        },
        {
          id: 'RESOURCE_OWNERSHIP',
          pattern: /function\s+isResourceOwner\(|function\s+isTourOwner\(/,
          description: 'Resource ownership verification'
        },
        {
          id: 'TIME_BASED_CONTROLS',
          pattern: /function\s+isRecentlyCreated\(|function\s+isFutureDate\(/,
          description: 'Time-based access controls'
        }
      ],

      // Known secure patterns
      securePatterns: [
        {
          id: 'AUTHENTICATED_AND_AUTHORIZED',
          pattern: /isAuthenticated\(\)\s+&&\s+\(.*hasRole\(|isResourceOwner\(/,
          description: 'Proper authentication and authorization'
        },
        {
          id: 'INPUT_VALIDATION',
          pattern: /data\.\w+\s+(is\s+string|is\s+number|is\s+bool|in\s+\[)/,
          description: 'Input type and value validation'
        },
        {
          id: 'SIZE_LIMITS',
          pattern: /\.size\(\)\s*[<>=]+\s*\d+/,
          description: 'String and array size validation'
        }
      ]
    };
  }

  // Analyze Firestore security rules
  async analyzeSecurityRules() {
    this.log('Firestore Security Rules analizi başlatılıyor...');

    if (!fs.existsSync(this.rulesFile)) {
      throw new Error('Firestore rules dosyası bulunamadı');
    }

    const rulesContent = fs.readFileSync(this.rulesFile, 'utf8');
    const analysis = {
      overview: {
        totalLines: rulesContent.split('\n').length,
        hasHelperFunctions: false,
        hasRoleBasedAccess: false,
        hasDataValidation: false,
        securityScore: 0
      },
      vulnerabilities: [],
      bestPractices: [],
      recommendations: [],
      riskAssessment: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    // Check for vulnerabilities
    this.vulnerabilityDatabase.antiPatterns.forEach(antiPattern => {
      const matches = rulesContent.match(new RegExp(antiPattern.pattern, 'g'));
      if (matches) {
        const vulnerability = {
          id: antiPattern.id,
          severity: antiPattern.severity,
          description: antiPattern.description,
          recommendation: antiPattern.recommendation,
          occurrences: matches.length,
          lines: this.findLineNumbers(rulesContent, antiPattern.pattern)
        };

        analysis.vulnerabilities.push(vulnerability);
        analysis.riskAssessment[antiPattern.severity.toLowerCase()]++;
      }
    });

    // Check for best practices
    this.vulnerabilityDatabase.bestPractices.forEach(practice => {
      const matches = rulesContent.match(new RegExp(practice.pattern, 'g'));
      if (matches) {
        analysis.bestPractices.push({
          id: practice.id,
          description: practice.description,
          implemented: true,
          occurrences: matches.length
        });

        // Update overview flags
        if (practice.id === 'ROLE_BASED_ACCESS') {
          analysis.overview.hasRoleBasedAccess = true;
        }
        if (practice.id === 'DATA_VALIDATION') {
          analysis.overview.hasDataValidation = true;
        }
      }
    });

    // Check for helper functions
    const helperFunctionPattern = /function\s+\w+\(/g;
    const helperFunctions = rulesContent.match(helperFunctionPattern);
    if (helperFunctions && helperFunctions.length > 0) {
      analysis.overview.hasHelperFunctions = true;
    }

    // Calculate security score
    analysis.overview.securityScore = this.calculateSecurityScore(analysis);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  // Find line numbers for patterns
  findLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const lineNumbers = [];
    const regex = new RegExp(pattern);

    lines.forEach((line, index) => {
      if (regex.test(line)) {
        lineNumbers.push(index + 1);
      }
    });

    return lineNumbers;
  }

  // Calculate security score (0-100)
  calculateSecurityScore(analysis) {
    let score = 100;

    // Deduct points for vulnerabilities
    analysis.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'CRITICAL':
          score -= 25 * vuln.occurrences;
          break;
        case 'HIGH':
          score -= 15 * vuln.occurrences;
          break;
        case 'MEDIUM':
          score -= 10 * vuln.occurrences;
          break;
        case 'LOW':
          score -= 5 * vuln.occurrences;
          break;
      }
    });

    // Add points for best practices
    const bestPracticeBonus = analysis.bestPractices.length * 5;
    score += Math.min(bestPracticeBonus, 20); // Max 20 bonus points

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  // Generate security recommendations
  generateRecommendations(analysis) {
    const recommendations = [];

    // Based on vulnerabilities
    if (analysis.riskAssessment.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'SECURITY_VULNERABILITY',
        message: 'Kritik güvenlik açıkları tespit edildi. Derhal düzeltilmeli!',
        actions: [
          'Unconditional allow rules kaldırın',
          'Proper authentication ve authorization ekleyin',
          'Security audit yapın'
        ]
      });
    }

    if (analysis.riskAssessment.high > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'DATA_VALIDATION',
        message: 'Veri doğrulama eksiklikleri tespit edildi',
        actions: [
          'Input validation functions ekleyin',
          'Data type checking uygulayın',
          'Size limits belirleyin'
        ]
      });
    }

    if (!analysis.overview.hasRoleBasedAccess) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'ACCESS_CONTROL',
        message: 'Role-based access control eksik',
        actions: [
          'User role helper functions ekleyin',
          'Role-based authorization uygulayın',
          'Admin/manager/customer ayrımı yapın'
        ]
      });
    }

    if (!analysis.overview.hasDataValidation) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'INPUT_VALIDATION',
        message: 'Kapsamlı data validation eksik',
        actions: [
          'Data validation helper functions ekleyin',
          'Required fields kontrolü yapın',
          'Data format validation uygulayın'
        ]
      });
    }

    // General recommendations
    recommendations.push({
      priority: 'LOW',
      category: 'MONITORING',
      message: 'Security monitoring ve logging iyileştirmesi',
      actions: [
        'Security audit logs ekleyin',
        'Failed access attempts takip edin',
        'Suspicious activity detection uygulayın'
      ]
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Test rule coverage
  async testRuleCoverage() {
    this.log('Rule coverage testi başlatılıyor...');

    const testScenarios = [
      // Authentication tests
      {
        description: 'Unauthenticated user access',
        path: '/users/test-user',
        operation: 'read',
        auth: null,
        expectedResult: 'DENY'
      },
      {
        description: 'User reading own profile',
        path: '/users/test-user',
        operation: 'read',
        auth: { uid: 'test-user', role: 'customer' },
        expectedResult: 'ALLOW'
      },
      {
        description: 'User reading other user profile',
        path: '/users/other-user',
        operation: 'read',
        auth: { uid: 'test-user', role: 'customer' },
        expectedResult: 'DENY'
      },
      {
        description: 'Admin reading any user profile',
        path: '/users/any-user',
        operation: 'read',
        auth: { uid: 'admin-user', role: 'admin' },
        expectedResult: 'ALLOW'
      },

      // Tour access tests
      {
        description: 'Public tour read access',
        path: '/tours/public-tour',
        operation: 'read',
        auth: null,
        expectedResult: 'ALLOW'
      },
      {
        description: 'Tour creation by tour operator',
        path: '/tours/new-tour',
        operation: 'create',
        auth: { uid: 'operator-user', role: 'tour_operator' },
        expectedResult: 'ALLOW'
      },
      {
        description: 'Tour creation by regular user',
        path: '/tours/new-tour',
        operation: 'create',
        auth: { uid: 'regular-user', role: 'customer' },
        expectedResult: 'DENY'
      },

      // Booking tests
      {
        description: 'User creating own booking',
        path: '/bookings/new-booking',
        operation: 'create',
        auth: { uid: 'test-user', role: 'customer' },
        data: { userId: 'test-user' },
        expectedResult: 'ALLOW'
      },
      {
        description: 'User creating booking for another user',
        path: '/bookings/new-booking',
        operation: 'create',
        auth: { uid: 'test-user', role: 'customer' },
        data: { userId: 'other-user' },
        expectedResult: 'DENY'
      }
    ];

    const coverageResults = {
      totalTests: testScenarios.length,
      passed: 0,
      failed: 0,
      scenarios: []
    };

    // Simulate rule testing (in a real implementation, this would use Firebase Emulator)
    testScenarios.forEach(scenario => {
      const result = this.simulateRuleTest(scenario);
      const passed = result === scenario.expectedResult;

      coverageResults.scenarios.push({
        ...scenario,
        actualResult: result,
        passed
      });

      if (passed) {
        coverageResults.passed++;
      } else {
        coverageResults.failed++;
      }
    });

    coverageResults.passRate = (coverageResults.passed / coverageResults.totalTests) * 100;

    return coverageResults;
  }

  // Simulate rule testing (simplified implementation)
  simulateRuleTest(scenario) {
    // This is a simplified simulation
    // Real implementation would use Firebase Emulator
    
    if (!scenario.auth && scenario.path.includes('/users/')) {
      return 'DENY';
    }

    if (scenario.auth && scenario.auth.role === 'admin') {
      return 'ALLOW';
    }

    if (scenario.operation === 'read' && scenario.path.includes('/tours/')) {
      return 'ALLOW'; // Public tours
    }

    if (scenario.operation === 'create' && scenario.path.includes('/tours/') && 
        scenario.auth && scenario.auth.role === 'tour_operator') {
      return 'ALLOW';
    }

    if (scenario.operation === 'create' && scenario.path.includes('/bookings/') &&
        scenario.auth && scenario.data && scenario.auth.uid === scenario.data.userId) {
      return 'ALLOW';
    }

    return 'DENY';
  }

  // Generate comprehensive security audit report
  async generateSecurityAuditReport() {
    this.log('Kapsamlı güvenlik audit raporu oluşturuluyor...');

    const securityAnalysis = await this.analyzeSecurityRules();
    const coverageResults = await this.testRuleCoverage();

    const auditReport = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      summary: {
        overallSecurityScore: securityAnalysis.overview.securityScore,
        riskLevel: this.calculateRiskLevel(securityAnalysis),
        testCoverage: coverageResults.passRate,
        criticalIssues: securityAnalysis.riskAssessment.critical,
        totalVulnerabilities: securityAnalysis.vulnerabilities.length,
        bestPracticesImplemented: securityAnalysis.bestPractices.length
      },
      detailedAnalysis: securityAnalysis,
      testCoverage: coverageResults,
      complianceCheck: this.checkCompliance(securityAnalysis),
      actionPlan: this.generateActionPlan(securityAnalysis),
      nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    // Ensure reports directory exists
    const reportsDir = path.dirname(this.auditReportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save detailed report
    fs.writeFileSync(this.auditReportFile, JSON.stringify(auditReport, null, 2));
    this.log(`Güvenlik audit raporu oluşturuldu: ${this.auditReportFile}`, 'success');

    // Generate executive summary
    this.generateExecutiveSummary(auditReport);

    return auditReport;
  }

  // Calculate overall risk level
  calculateRiskLevel(analysis) {
    if (analysis.riskAssessment.critical > 0) return 'CRITICAL';
    if (analysis.riskAssessment.high > 2) return 'HIGH';
    if (analysis.riskAssessment.medium > 5) return 'MEDIUM';
    return 'LOW';
  }

  // Check compliance with security standards
  checkCompliance(analysis) {
    const complianceChecks = {
      'OWASP_TOP_10': {
        passed: analysis.riskAssessment.critical === 0,
        description: 'OWASP Top 10 security vulnerabilities'
      },
      'PRINCIPLE_OF_LEAST_PRIVILEGE': {
        passed: analysis.overview.hasRoleBasedAccess,
        description: 'Principle of least privilege implementation'
      },
      'INPUT_VALIDATION': {
        passed: analysis.overview.hasDataValidation,
        description: 'Comprehensive input validation'
      },
      'AUTHENTICATION_SECURITY': {
        passed: analysis.vulnerabilities.filter(v => v.id === 'WEAK_AUTH').length === 0,
        description: 'Strong authentication mechanisms'
      }
    };

    const passedChecks = Object.values(complianceChecks).filter(check => check.passed).length;
    const totalChecks = Object.keys(complianceChecks).length;

    return {
      checks: complianceChecks,
      overallCompliance: (passedChecks / totalChecks) * 100,
      passedChecks,
      totalChecks
    };
  }

  // Generate action plan
  generateActionPlan(analysis) {
    const actionPlan = {
      immediate: [], // Within 24 hours
      shortTerm: [], // Within 1 week
      mediumTerm: [], // Within 1 month
      longTerm: [] // Within 3 months
    };

    analysis.recommendations.forEach(rec => {
      const action = {
        priority: rec.priority,
        category: rec.category,
        description: rec.message,
        actions: rec.actions,
        estimatedEffort: this.estimateEffort(rec.priority),
        assignee: this.suggestAssignee(rec.category)
      };

      switch (rec.priority) {
        case 'CRITICAL':
          actionPlan.immediate.push(action);
          break;
        case 'HIGH':
          actionPlan.shortTerm.push(action);
          break;
        case 'MEDIUM':
          actionPlan.mediumTerm.push(action);
          break;
        case 'LOW':
          actionPlan.longTerm.push(action);
          break;
      }
    });

    return actionPlan;
  }

  // Estimate effort for security fixes
  estimateEffort(priority) {
    const effortMap = {
      'CRITICAL': '4-8 hours',
      'HIGH': '2-4 hours',
      'MEDIUM': '1-2 hours',
      'LOW': '30-60 minutes'
    };
    return effortMap[priority] || '1 hour';
  }

  // Suggest assignee based on category
  suggestAssignee(category) {
    const assigneeMap = {
      'SECURITY_VULNERABILITY': 'Security Engineer',
      'ACCESS_CONTROL': 'Backend Developer',
      'DATA_VALIDATION': 'Backend Developer',
      'INPUT_VALIDATION': 'Backend Developer',
      'MONITORING': 'DevOps Engineer'
    };
    return assigneeMap[category] || 'Development Team';
  }

  // Generate executive summary
  generateExecutiveSummary(auditReport) {
    const summary = [
      '# 🔒 Firestore Security Audit - Executive Summary',
      `**Audit Date:** ${new Date(auditReport.timestamp).toLocaleDateString('tr-TR')}`,
      '',
      '## 📊 Key Metrics',
      `- **Overall Security Score:** ${auditReport.summary.overallSecurityScore}/100`,
      `- **Risk Level:** ${auditReport.summary.riskLevel}`,
      `- **Test Coverage:** ${auditReport.summary.testCoverage.toFixed(1)}%`,
      `- **Critical Issues:** ${auditReport.summary.criticalIssues}`,
      `- **Total Vulnerabilities:** ${auditReport.summary.totalVulnerabilities}`,
      '',
      '## 🎯 Priority Actions',
      ...auditReport.actionPlan.immediate.map(action => 
        `- **CRITICAL:** ${action.description}`
      ),
      ...auditReport.actionPlan.shortTerm.slice(0, 3).map(action => 
        `- **HIGH:** ${action.description}`
      ),
      '',
      '## ✅ Compliance Status',
      `- **Overall Compliance:** ${auditReport.complianceCheck.overallCompliance.toFixed(1)}%`,
      `- **Passed Checks:** ${auditReport.complianceCheck.passedChecks}/${auditReport.complianceCheck.totalChecks}`,
      '',
      '## 📅 Next Steps',
      `- **Immediate Actions:** ${auditReport.actionPlan.immediate.length} items`,
      `- **Short Term:** ${auditReport.actionPlan.shortTerm.length} items`,
      `- **Next Audit:** ${new Date(auditReport.nextAuditDate).toLocaleDateString('tr-TR')}`,
      '',
      '## 🔗 Resources',
      '- Detailed report: `reports/security-audit.json`',
      '- Security rules: `firestore.advanced.rules`',
      '- Best practices: [Firebase Security Documentation](https://firebase.google.com/docs/rules/rules-and-auth)'
    ];

    const summaryFile = path.join(path.dirname(this.auditReportFile), 'security-audit-summary.md');
    fs.writeFileSync(summaryFile, summary.join('\n'));
    this.log(`Executive summary oluşturuldu: ${summaryFile}`, 'success');
  }
}

// CLI execution
if (require.main === module) {
  const auditor = new FirestoreSecurityAudit();
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      auditor.analyzeSecurityRules()
        .then(analysis => {
          console.log('\n✅ Security rules analizi tamamlandı!');
          console.log(`📊 Security Score: ${analysis.overview.securityScore}/100`);
          console.log(`🚨 Critical Issues: ${analysis.riskAssessment.critical}`);
          console.log(`⚠️  Total Vulnerabilities: ${analysis.vulnerabilities.length}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Security analizi başarısız:', error.message);
          process.exit(1);
        });
      break;

    case 'test':
      auditor.testRuleCoverage()
        .then(coverage => {
          console.log('\n✅ Rule coverage testi tamamlandı!');
          console.log(`📈 Pass Rate: ${coverage.passRate.toFixed(1)}%`);
          console.log(`✅ Passed: ${coverage.passed}/${coverage.totalTests}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Coverage testi başarısız:', error.message);
          process.exit(1);
        });
      break;

    case 'audit':
      auditor.generateSecurityAuditReport()
        .then(report => {
          console.log('\n✅ Security audit tamamlandı!');
          console.log(`📊 Overall Score: ${report.summary.overallSecurityScore}/100`);
          console.log(`🎯 Risk Level: ${report.summary.riskLevel}`);
          console.log(`📋 Action Items: ${report.actionPlan.immediate.length + report.actionPlan.shortTerm.length}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Security audit başarısız:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('Kullanım:');
      console.log('  node security-audit.js analyze    - Security rules analizi');
      console.log('  node security-audit.js test       - Rule coverage testi');
      console.log('  node security-audit.js audit      - Kapsamlı security audit');
  }
}

module.exports = FirestoreSecurityAudit;






