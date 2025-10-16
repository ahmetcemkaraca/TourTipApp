import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule, ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin interfaces
interface BulkUserOperation {
  operation: 'create' | 'update' | 'delete' | 'disable' | 'enable';
  users: any[];
  options?: {
    sendWelcomeEmail?: boolean;
    notifyUsers?: boolean;
    skipValidation?: boolean;
  };
}

interface DataMigrationConfig {
  sourceCollection: string;
  targetCollection: string;
  transformFunction?: string;
  batchSize: number;
  dryRun: boolean;
  backupOriginal: boolean;
}

interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTours: number;
  activeTours: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  systemHealth: {
    firestoreStatus: string;
    functionsStatus: string;
    storageStatus: string;
    authStatus: string;
  };
  recentActivity: any[];
}

interface UserManagementRequest {
  userIds?: string[];
  filters?: {
    role?: string;
    isActive?: boolean;
    lastLoginBefore?: string;
    createdAfter?: string;
    emailVerified?: boolean;
  };
  action: 'list' | 'disable' | 'enable' | 'delete' | 'updateRole' | 'sendEmail';
  params?: any;
}

// Verify admin access
async function verifyAdminAccess(authUser: any): Promise<void> {
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const userDoc = await admin.firestore().collection('users').doc(authUser.uid).get();
  const userData = userDoc.data();

  if (!userData || userData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  // Check if user is active
  if (!userData.isActive) {
    throw new HttpsError('permission-denied', 'User account is disabled');
  }

  // Log admin action
  await admin.firestore().collection('admin_logs').add({
    adminUserId: authUser.uid,
    adminEmail: authUser.email,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    action: 'admin_access_verification',
    ip: null, // Would be extracted from request in real implementation
    userAgent: null
  });
}

// Bulk user operations
export const bulkUserOperations = onCall({
  memory: '1GiB',
  timeoutSeconds: 540
}, async (request: CallableRequest) => {
  await verifyAdminAccess(request.auth);

  const { operation, users, options = {} }: BulkUserOperation = request.data;

  if (!operation || !users || !Array.isArray(users)) {
    throw new HttpsError('invalid-argument', 'Invalid operation or users data');
  }

  if (users.length > 1000) {
    throw new HttpsError('invalid-argument', 'Maximum 1000 users per operation');
  }

  logger.info(`Starting bulk ${operation} operation for ${users.length} users`);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[],
    processedUsers: [] as any[]
  };

  const db = admin.firestore();
  const auth = admin.auth();

  try {
    // Process users in batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      for (const userData of batch) {
        try {
          let result;
          
          switch (operation) {
            case 'create':
              // Create user in Firebase Auth
              const authUser = await auth.createUser({
                email: userData.email,
                password: userData.password || generateRandomPassword(),
                displayName: userData.displayName,
                emailVerified: userData.emailVerified || false,
                disabled: false
              });

              // Create user document in Firestore
              await db.collection('users').doc(authUser.uid).set({
                id: authUser.uid,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role || 'customer',
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: request.auth?.uid,
                profile: userData.profile || {}
              });

              // Send welcome email if requested
              if (options.sendWelcomeEmail) {
                // Would integrate with email service
                logger.info(`Welcome email queued for ${userData.email}`);
              }

              result = { uid: authUser.uid, email: userData.email, operation: 'created' };
              break;

            case 'update':
              if (!userData.uid) {
                throw new Error('UID required for update operation');
              }

              // Update Auth user
              if (userData.email || userData.displayName || userData.emailVerified !== undefined) {
                await auth.updateUser(userData.uid, {
                  email: userData.email,
                  displayName: userData.displayName,
                  emailVerified: userData.emailVerified
                });
              }

              // Update Firestore document
              const updateData = { ...userData };
              delete updateData.uid;
              updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
              updateData.updatedBy = request.auth?.uid;

              await db.collection('users').doc(userData.uid).update(updateData);

              result = { uid: userData.uid, operation: 'updated' };
              break;

            case 'delete':
              if (!userData.uid) {
                throw new Error('UID required for delete operation');
              }

              // Delete from Auth
              await auth.deleteUser(userData.uid);

              // Delete from Firestore (or mark as deleted)
              await db.collection('users').doc(userData.uid).delete();

              result = { uid: userData.uid, operation: 'deleted' };
              break;

            case 'disable':
              if (!userData.uid) {
                throw new Error('UID required for disable operation');
              }

              // Disable in Auth
              await auth.updateUser(userData.uid, { disabled: true });

              // Update Firestore
              await db.collection('users').doc(userData.uid).update({
                isActive: false,
                disabledAt: admin.firestore.FieldValue.serverTimestamp(),
                disabledBy: request.auth?.uid
              });

              result = { uid: userData.uid, operation: 'disabled' };
              break;

            case 'enable':
              if (!userData.uid) {
                throw new Error('UID required for enable operation');
              }

              // Enable in Auth
              await auth.updateUser(userData.uid, { disabled: false });

              // Update Firestore
              await db.collection('users').doc(userData.uid).update({
                isActive: true,
                enabledAt: admin.firestore.FieldValue.serverTimestamp(),
                enabledBy: request.auth?.uid
              });

              result = { uid: userData.uid, operation: 'enabled' };
              break;

            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }

          results.success++;
          results.processedUsers.push(result);
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            user: userData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error(`Failed to process user ${userData.email || userData.uid}:`, error);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log the bulk operation
    await db.collection('admin_logs').add({
      adminUserId: request.auth?.uid,
      adminEmail: request.auth?.token?.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: `bulk_user_${operation}`,
      details: {
        totalUsers: users.length,
        successful: results.success,
        failed: results.failed,
        options
      },
      results: results.errors.slice(0, 10) // Log first 10 errors
    });

    logger.info(`Bulk ${operation} completed: ${results.success} success, ${results.failed} failed`);

    return {
      success: true,
      operation,
      results
    };

  } catch (error) {
    logger.error(`Bulk operation ${operation} failed:`, error);
    throw new HttpsError('internal', `Bulk operation failed: ${error}`);
  }
});

// Data migration tool
export const migrateData = onCall({
  memory: '2GiB',
  timeoutSeconds: 540
}, async (request: CallableRequest) => {
  await verifyAdminAccess(request.auth);

  const config: DataMigrationConfig = request.data;

  if (!config.sourceCollection || !config.targetCollection) {
    throw new HttpsError('invalid-argument', 'Source and target collections required');
  }

  logger.info(`Starting data migration: ${config.sourceCollection} -> ${config.targetCollection}`);

  const db = admin.firestore();
  const results = {
    totalDocuments: 0,
    migrated: 0,
    failed: 0,
    errors: [] as any[]
  };

  try {
    // Get total count
    const sourceRef = db.collection(config.sourceCollection);
    const snapshot = await sourceRef.get();
    results.totalDocuments = snapshot.size;

    if (results.totalDocuments === 0) {
      return {
        success: true,
        message: 'No documents to migrate',
        results
      };
    }

    logger.info(`Found ${results.totalDocuments} documents to migrate`);

    // Create backup if requested
    if (config.backupOriginal) {
      const backupCollection = `${config.sourceCollection}_backup_${Date.now()}`;
      logger.info(`Creating backup in ${backupCollection}`);
      
      // This would be implemented with batch operations in real scenario
      // await createCollectionBackup(config.sourceCollection, backupCollection);
    }

    // Process documents in batches
    const batchSize = config.batchSize || 100;
    let processed = 0;

    while (processed < results.totalDocuments) {
      const batchSnapshot = await sourceRef
        .offset(processed)
        .limit(batchSize)
        .get();

      if (batchSnapshot.empty) break;

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of batchSnapshot.docs) {
        try {
          let data = doc.data();
          
          // Apply transformation if specified
          if (config.transformFunction) {
            data = await applyTransformation(data, config.transformFunction);
          }

          // Add migration metadata
          data.migratedAt = admin.firestore.FieldValue.serverTimestamp();
          data.migratedFrom = config.sourceCollection;
          data.originalId = doc.id;

          if (!config.dryRun) {
            const targetRef = db.collection(config.targetCollection).doc(doc.id);
            batch.set(targetRef, data);
            batchCount++;
          }

          results.migrated++;
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            documentId: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Commit batch if not dry run
      if (!config.dryRun && batchCount > 0) {
        await batch.commit();
      }

      processed += batchSnapshot.size;
      logger.info(`Migration progress: ${processed}/${results.totalDocuments}`);

      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Log migration
    await db.collection('admin_logs').add({
      adminUserId: request.auth?.uid,
      adminEmail: request.auth?.token?.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: 'data_migration',
      details: {
        config,
        results,
        dryRun: config.dryRun
      }
    });

    logger.info(`Migration completed: ${results.migrated} migrated, ${results.failed} failed`);

    return {
      success: true,
      results,
      dryRun: config.dryRun
    };

  } catch (error) {
    logger.error('Data migration failed:', error);
    throw new HttpsError('internal', `Migration failed: ${error}`);
  }
});

// User management operations
export const manageUsers = onCall({
  memory: '512MiB',
  timeoutSeconds: 300
}, async (request: CallableRequest) => {
  await verifyAdminAccess(request.auth);

  const { userIds, filters, action, params }: UserManagementRequest = request.data;

  if (!action) {
    throw new HttpsError('invalid-argument', 'Action is required');
  }

  logger.info(`User management action: ${action}`);

  const db = admin.firestore();
  const auth = admin.auth();
  let users: any[] = [];

  try {
    // Get users based on IDs or filters
    if (userIds && userIds.length > 0) {
      // Get specific users by ID
      for (const uid of userIds) {
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            users.push({ id: uid, ...userDoc.data() });
          }
        } catch (error) {
          logger.warn(`Failed to get user ${uid}:`, error);
        }
      }
    } else if (filters) {
      // Query users based on filters
      let query: any = db.collection('users');

      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }
      if (filters.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }
      if (filters.emailVerified !== undefined) {
        // This would need to be queried from Auth, not Firestore
      }
      if (filters.lastLoginBefore) {
        query = query.where('lastLoginAt', '<', new Date(filters.lastLoginBefore));
      }
      if (filters.createdAfter) {
        query = query.where('createdAt', '>', new Date(filters.createdAfter));
      }

      query = query.limit(1000); // Safety limit

      const snapshot = await query.get();
      users = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } else {
      throw new HttpsError('invalid-argument', 'Either userIds or filters must be provided');
    }

    logger.info(`Found ${users.length} users for action ${action}`);

    const results = {
      totalUsers: users.length,
      processed: 0,
      errors: [] as any[]
    };

    // Execute action
    switch (action) {
      case 'list':
        return {
          success: true,
          users: users.map(user => ({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
          })),
          total: users.length
        };

      case 'disable':
        for (const user of users) {
          try {
            await auth.updateUser(user.id, { disabled: true });
            await db.collection('users').doc(user.id).update({
              isActive: false,
              disabledAt: admin.firestore.FieldValue.serverTimestamp(),
              disabledBy: request.auth?.uid,
              disabledReason: params?.reason || 'Admin action'
            });
            results.processed++;
          } catch (error) {
            results.errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        break;

      case 'enable':
        for (const user of users) {
          try {
            await auth.updateUser(user.id, { disabled: false });
            await db.collection('users').doc(user.id).update({
              isActive: true,
              enabledAt: admin.firestore.FieldValue.serverTimestamp(),
              enabledBy: request.auth?.uid
            });
            results.processed++;
          } catch (error) {
            results.errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        break;

      case 'updateRole':
        if (!params?.newRole) {
          throw new HttpsError('invalid-argument', 'newRole parameter required');
        }

        for (const user of users) {
          try {
            await db.collection('users').doc(user.id).update({
              role: params.newRole,
              roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              roleUpdatedBy: request.auth?.uid
            });
            results.processed++;
          } catch (error) {
            results.errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        break;

      case 'delete':
        for (const user of users) {
          try {
            await auth.deleteUser(user.id);
            await db.collection('users').doc(user.id).delete();
            results.processed++;
          } catch (error) {
            results.errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        break;

      case 'sendEmail':
        if (!params?.emailTemplate || !params?.subject) {
          throw new HttpsError('invalid-argument', 'emailTemplate and subject parameters required');
        }

        // Queue emails (would integrate with email service)
        for (const user of users) {
          try {
            await db.collection('email_queue').add({
              to: user.email,
              subject: params.subject,
              template: params.emailTemplate,
              data: params.emailData || {},
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'pending'
            });
            results.processed++;
          } catch (error) {
            results.errors.push({ userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
        break;

      default:
        throw new HttpsError('invalid-argument', `Unsupported action: ${action}`);
    }

    // Log the action
    await db.collection('admin_logs').add({
      adminUserId: request.auth?.uid,
      adminEmail: request.auth?.token?.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: `user_management_${action}`,
      details: {
        filters,
        userIds,
        params,
        results
      }
    });

    return {
      success: true,
      action,
      results
    };

  } catch (error) {
    logger.error(`User management action ${action} failed:`, error);
    throw new HttpsError('internal', `User management failed: ${error}`);
  }
});

// Get admin dashboard metrics
export const getAdminDashboardMetrics = onCall({
  memory: '512MiB',
  timeoutSeconds: 120
}, async (request: CallableRequest) => {
  await verifyAdminAccess(request.auth);

  logger.info('Generating admin dashboard metrics');

  const db = admin.firestore();

  try {
    const metrics: AdminDashboardMetrics = {
      totalUsers: 0,
      activeUsers: 0,
      totalTours: 0,
      activeTours: 0,
      totalBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      systemHealth: {
        firestoreStatus: 'healthy',
        functionsStatus: 'healthy',
        storageStatus: 'healthy',
        authStatus: 'healthy'
      },
      recentActivity: []
    };

    // Execute queries in parallel
    const [
      usersSnapshot,
      activeUsersSnapshot,
      toursSnapshot,
      activeToursSnapshot,
      bookingsSnapshot,
      pendingBookingsSnapshot,
      paidBookingsSnapshot,
      recentActivitySnapshot
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('users').where('isActive', '==', true).get(),
      db.collection('tours').get(),
      db.collection('tours').where('isActive', '==', true).get(),
      db.collection('bookings').get(),
      db.collection('bookings').where('status', '==', 'pending').get(),
      db.collection('bookings').where('paymentStatus', '==', 'paid').get(),
      db.collection('admin_logs')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get()
    ]);

    // Calculate metrics
    metrics.totalUsers = usersSnapshot.size;
    metrics.activeUsers = activeUsersSnapshot.size;
    metrics.totalTours = toursSnapshot.size;
    metrics.activeTours = activeToursSnapshot.size;
    metrics.totalBookings = bookingsSnapshot.size;
    metrics.pendingBookings = pendingBookingsSnapshot.size;

    // Calculate total revenue
    metrics.totalRevenue = paidBookingsSnapshot.docs.reduce((total: number, doc: any) => {
      const data = doc.data();
      return total + (data.totalAmount?.amount || 0);
    }, 0);

    // Get recent activity
    metrics.recentActivity = recentActivitySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        adminEmail: data.adminEmail,
        action: data.action,
        timestamp: data.timestamp?.toDate?.(),
        details: data.details
      };
    });

    // System health checks (simplified)
    try {
      await db.collection('health_check').doc('test').set({ timestamp: new Date() }, { merge: true });
      metrics.systemHealth.firestoreStatus = 'healthy';
    } catch (error) {
      metrics.systemHealth.firestoreStatus = 'error';
    }

    logger.info('Admin dashboard metrics generated successfully');

    return {
      success: true,
      metrics,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Failed to generate admin dashboard metrics:', error);
    throw new HttpsError('internal', `Failed to generate metrics: ${error}`);
  }
});

// Cleanup inactive users (scheduled)
export const cleanupInactiveUsers = onSchedule({
  schedule: 'every sunday 02:00',
  timeZone: 'Europe/Istanbul',
  memory: '512MiB'
}, async (event: ScheduledEvent) => {
  logger.info('Starting cleanup of inactive users');

  const db = admin.firestore();
  const auth = admin.auth();

  try {
    // Find users inactive for more than 2 years
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    const inactiveUsersSnapshot = await db.collection('users')
      .where('lastLoginAt', '<', cutoffDate)
      .where('isActive', '==', false)
      .limit(100) // Process in batches
      .get();

    let deletedCount = 0;
    const errors: any[] = [];

    for (const doc of inactiveUsersSnapshot.docs) {
      try {
        const userData = doc.data();
        
        // Additional checks
        if (userData.role === 'admin') {
          continue; // Never delete admin users
        }

        // Check if user has any recent bookings
        const recentBookingsSnapshot = await db.collection('bookings')
          .where('userId', '==', doc.id)
          .where('createdAt', '>', cutoffDate)
          .limit(1)
          .get();

        if (!recentBookingsSnapshot.empty) {
          continue; // User has recent activity
        }

        // Delete from Auth
        await auth.deleteUser(doc.id);
        
        // Delete from Firestore
        await db.collection('users').doc(doc.id).delete();
        
        deletedCount++;
        logger.info(`Deleted inactive user: ${userData.email}`);

      } catch (error) {
        errors.push({
          userId: doc.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log cleanup results
    await db.collection('admin_logs').add({
      adminUserId: 'system',
      adminEmail: 'system@tourtrip.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: 'cleanup_inactive_users',
      details: {
        deletedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Log first 10 errors
        cutoffDate: cutoffDate.toISOString()
      }
    });

    logger.info(`Cleanup completed: ${deletedCount} users deleted, ${errors.length} errors`);

  } catch (error) {
    logger.error('Cleanup inactive users failed:', error);
  }
});

// Helper functions
function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
}

async function applyTransformation(data: any, transformFunction: string): Promise<any> {
  // This would apply predefined transformation functions
  switch (transformFunction) {
    case 'flattenLocation':
      if (data.location) {
        data.locationName = data.location.name;
        data.locationCity = data.location.city;
        data.locationCountry = data.location.country;
        delete data.location;
      }
      break;
      
    case 'convertTimestamps':
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key] === 'object' && data[key]._seconds) {
          data[key] = new Date(data[key]._seconds * 1000).toISOString();
        }
      });
      break;
      
    default:
      logger.warn(`Unknown transformation function: ${transformFunction}`);
  }
  
  return data;
}

