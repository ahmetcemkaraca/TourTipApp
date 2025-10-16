import { onSchedule, ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { BigQuery } from '@google-cloud/bigquery';
import * as admin from 'firebase-admin';

// Initialize BigQuery
const bigquery = new BigQuery({
  projectId: (process as any).env.GOOGLE_CLOUD_PROJECT_ID
});

const datasetId = (process as any).env.BIGQUERY_DATASET_ID || 'tourtrip_analytics';
const tablePrefix = (process as any).env.BIGQUERY_TABLE_PREFIX || 'tourtrip_';

// Interfaces
interface ExportConfig {
  collections: string[];
  batchSize: number;
  enableIncremental: boolean;
  transformations?: Record<string, any>;
}

interface QueryRequest {
  query: string;
  parameters?: Record<string, any>;
  maxResults?: number;
  useCache?: boolean;
}

interface DashboardMetrics {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  conversionRate: number;
  topTours: any[];
  revenueByMonth: any[];
  userGrowth: any[];
}

// Scheduled data export from Firestore to BigQuery
export const exportFirestoreToBigQuery = onSchedule({
  schedule: 'every 24 hours',
  timeZone: 'Europe/Istanbul',
  memory: '1GiB',
  timeoutSeconds: 3600
}, async (event: ScheduledEvent) => {
  logger.info('Starting Firestore to BigQuery export');

  try {
    // const db = admin.firestore();
    
    // Export configurations for different collections
    const exportConfigs: Record<string, ExportConfig> = {
      users: {
        collections: ['users'],
        batchSize: 1000,
        enableIncremental: true,
        transformations: {
          // Remove sensitive data
          excludeFields: ['password', 'paymentMethods'],
          // Transform location data
          flattenLocation: true
        }
      },
      tours: {
        collections: ['tours'],
        batchSize: 500,
        enableIncremental: true,
        transformations: {
          // Flatten nested objects
          flattenLocation: true,
          flattenPrice: true
        }
      },
      bookings: {
        collections: ['bookings'],
        batchSize: 1000,
        enableIncremental: true,
        transformations: {
          // Calculate additional metrics
          addDerivedFields: ['bookingAge', 'timeToBooking']
        }
      },
      analytics_events: {
        collections: ['analytics_events'],
        batchSize: 5000,
        enableIncremental: true,
        transformations: {
          // Flatten event properties
          flattenProperties: true
        }
      },
      reviews: {
        collections: ['reviews'],
        batchSize: 1000,
        enableIncremental: true
      }
    };

    // Process each export configuration
    for (const [configName, config] of Object.entries(exportConfigs)) {
      await exportCollectionToBigQuery(configName, config);
    }

    // Update metadata table
    await updateExportMetadata();

    logger.info('Firestore to BigQuery export completed successfully');
  } catch (error) {
    logger.error('Export failed:', error);
    throw error;
  }
});

// Export specific collection to BigQuery
async function exportCollectionToBigQuery(configName: string, config: ExportConfig) {
  logger.info(`Exporting ${configName} to BigQuery`);

  const db = admin.firestore();
  const tableName = `${tablePrefix}${configName}`;

  try {
    // Ensure dataset exists
    await ensureDatasetExists();

    // Get last export timestamp for incremental export
    let lastExportTime = new Date(0);
    if (config.enableIncremental) {
      lastExportTime = await getLastExportTime(tableName);
    }

    // Query documents
    for (const collectionName of config.collections) {
      let query = db.collection(collectionName);

      // Add incremental filter
      if (config.enableIncremental && lastExportTime.getTime() > 0) {
        query = (query as any).where('updatedAt', '>', admin.firestore.Timestamp.fromDate(lastExportTime));
      }

      // Process in batches
      let lastDoc: any = null;
      let processedCount = 0;

      do {
        let batchQuery = query.limit(config.batchSize);
        
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }

        const snapshot = await batchQuery.get();
        
        if (snapshot.empty) {
          break;
        }

        // Transform documents
        const rows = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return transformDocumentForBigQuery(doc.id, data, config.transformations);
        });

        // Insert to BigQuery
        await insertRowsToBigQuery(tableName, rows);

        processedCount += rows.length;
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        logger.info(`Processed ${processedCount} documents from ${collectionName}`);
      } while (true);
    }

    // Update last export time
    await updateLastExportTime(tableName);

    logger.info(`Completed export of ${configName}`);
  } catch (error) {
    logger.error(`Failed to export ${configName}:`, error);
    throw error;
  }
}

// Transform Firestore document for BigQuery
function transformDocumentForBigQuery(docId: string, data: any, transformations?: any): any {
  const row = {
    document_id: docId,
    exported_at: new Date().toISOString(),
    ...data
  };

  if (!transformations) {
    return row;
  }

  // Remove sensitive fields
  if (transformations.excludeFields) {
    transformations.excludeFields.forEach((field: string) => {
      delete row[field];
    });
  }

  // Flatten location data
  if (transformations.flattenLocation && row.location) {
    row.location_name = row.location.name;
    row.location_city = row.location.city;
    row.location_country = row.location.country;
    row.location_latitude = row.location.coordinates?.latitude;
    row.location_longitude = row.location.coordinates?.longitude;
    delete row.location;
  }

  // Flatten price data
  if (transformations.flattenPrice && row.price) {
    row.price_amount = row.price.amount;
    row.price_currency = row.price.currency;
    delete row.price;
  }

  // Flatten event properties
  if (transformations.flattenProperties && row.properties) {
    Object.entries(row.properties).forEach(([key, value]) => {
      row[`property_${key}`] = value;
    });
    delete row.properties;
  }

  // Add derived fields
  if (transformations.addDerivedFields) {
    transformations.addDerivedFields.forEach((field: string) => {
      switch (field) {
        case 'bookingAge':
          if (row.createdAt) {
            const createdDate = new Date(row.createdAt._seconds * 1000);
            row.booking_age_days = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
        case 'timeToBooking':
          if (row.createdAt && row.bookingDate) {
            const createdDate = new Date(row.createdAt._seconds * 1000);
            const bookingDate = new Date(row.bookingDate._seconds * 1000);
            row.time_to_booking_days = Math.floor((bookingDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
      }
    });
  }

  // Convert Firestore timestamps to ISO strings
  Object.keys(row).forEach(key => {
    if (row[key] && typeof row[key] === 'object' && row[key]._seconds) {
      row[key] = new Date(row[key]._seconds * 1000).toISOString();
    }
  });

  return row;
}

// Ensure BigQuery dataset exists
async function ensureDatasetExists() {
  try {
    const [dataset] = await bigquery.dataset(datasetId).get({ autoCreate: true });
    logger.info(`Dataset ${datasetId} ready`);
    return dataset;
  } catch (error) {
    logger.error('Failed to create/get dataset:', error);
    throw error;
  }
}

// Insert rows to BigQuery table
async function insertRowsToBigQuery(tableName: string, rows: any[]) {
  if (rows.length === 0) return;

  try {
    const table = bigquery.dataset(datasetId).table(tableName);
    
    // Ensure table exists (auto-create with schema detection)
    const [tableExists] = await table.exists();
    if (!tableExists) {
      await table.create({
        schema: { fields: [] }, // Auto-detect schema
        location: 'EU'
      });
      logger.info(`Created table ${tableName}`);
    }

    // Insert rows
    await table.insert(rows, {
      ignoreUnknownValues: true,
      skipInvalidRows: false
    });

    logger.info(`Inserted ${rows.length} rows to ${tableName}`);
  } catch (error) {
    logger.error(`Failed to insert rows to ${tableName}:`, error);
    throw error;
  }
}

// Get last export time from metadata
async function getLastExportTime(tableName: string): Promise<Date> {
  try {
    const metadataTable = bigquery.dataset(datasetId).table(`${tablePrefix}export_metadata`);
    const [rows] = await (metadataTable as any).query(`
      SELECT last_export_time
      FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}export_metadata\`
      WHERE table_name = @tableName
      ORDER BY last_export_time DESC
      LIMIT 1
    `, {
      params: { tableName }
    });

    if (rows.length > 0) {
      return new Date(rows[0].last_export_time);
    }
  } catch (error) {
    logger.info(`No previous export time found for ${tableName}`);
  }

  return new Date(0);
}

// Update last export time
async function updateLastExportTime(tableName: string) {
  try {
    const metadataTable = bigquery.dataset(datasetId).table(`${tablePrefix}export_metadata`);
    
    // Ensure metadata table exists
    const [tableExists] = await metadataTable.exists();
    if (!tableExists) {
      await metadataTable.create({
        schema: [
          { name: 'table_name', type: 'STRING' },
          { name: 'last_export_time', type: 'TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP' }
        ],
        location: 'EU'
      });
    }

    // Insert/update metadata
    await metadataTable.insert([{
      table_name: tableName,
      last_export_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
  } catch (error) {
    logger.error(`Failed to update export metadata for ${tableName}:`, error);
  }
}

// Update export metadata summary
async function updateExportMetadata() {
  try {
    const summaryTable = bigquery.dataset(datasetId).table(`${tablePrefix}export_summary`);
    
    // Ensure summary table exists
    const [tableExists] = await summaryTable.exists();
    if (!tableExists) {
      await summaryTable.create({
        schema: [
          { name: 'export_date', type: 'DATE' },
          { name: 'total_records_exported', type: 'INTEGER' },
          { name: 'tables_exported', type: 'INTEGER' },
          { name: 'export_duration_seconds', type: 'INTEGER' },
          { name: 'success', type: 'BOOLEAN' }
        ],
        location: 'EU'
      });
    }

    // Calculate summary metrics
    const exportDate = new Date().toISOString().split('T')[0];
    const totalRecords = await getTotalRecordsExported(exportDate);
    
    await summaryTable.insert([{
      export_date: exportDate,
      total_records_exported: totalRecords,
      tables_exported: 5, // users, tours, bookings, events, reviews
      export_duration_seconds: 0, // Would be calculated in real implementation
      success: true
    }]);
  } catch (error) {
    logger.error('Failed to update export summary:', error);
  }
}

// Get total records exported today
async function getTotalRecordsExported(exportDate: string): Promise<number> {
  try {
    const [rows] = await (bigquery as any).query(`
      SELECT 
        (SELECT COUNT(*) FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}users\` WHERE DATE(exported_at) = @exportDate) +
        (SELECT COUNT(*) FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}tours\` WHERE DATE(exported_at) = @exportDate) +
        (SELECT COUNT(*) FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\` WHERE DATE(exported_at) = @exportDate) +
        (SELECT COUNT(*) FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}analytics_events\` WHERE DATE(exported_at) = @exportDate) +
        (SELECT COUNT(*) FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}reviews\` WHERE DATE(exported_at) = @exportDate) as total
    `, {
      params: { exportDate }
    });

    return rows[0]?.total || 0;
  } catch (error) {
    logger.error('Failed to calculate total records:', error);
    return 0;
  }
}

// Custom query execution
export const executeCustomQuery = onCall({
  memory: '512MiB',
  timeoutSeconds: 300
}, async (request: CallableRequest) => {
  const { query, parameters, maxResults = 1000, useCache = true }: QueryRequest = request.data;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Verify user has admin role
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  try {
    logger.info(`Executing custom query for user ${request.auth.uid}`);

    // Validate query (basic security check)
    if (!isQuerySafe(query)) {
      throw new HttpsError('invalid-argument', 'Query contains unsafe operations');
    }

    const options: any = {
      query,
      location: 'EU',
      maxResults,
      useQueryCache: useCache
    };

    if (parameters) {
      options.params = parameters;
    }

    const [rows] = await bigquery.query(options);

    logger.info(`Query executed successfully, returned ${rows.length} rows`);

    return {
      success: true,
      data: rows,
      rowCount: rows.length,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Query execution failed:', error);
    throw new HttpsError('internal', `Query execution failed: ${error}`);
  }
});

// Basic query safety check
function isQuerySafe(query: string): boolean {
  const dangerousKeywords = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 
    'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
  ];

  const upperQuery = query.toUpperCase();
  return !dangerousKeywords.some(keyword => upperQuery.includes(keyword));
}

// Get business intelligence dashboard data
export const getDashboardMetrics = onCall({
  memory: '512MiB',
  timeoutSeconds: 120
}, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Verify user has appropriate role
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || !['admin', 'manager'].includes(userData.role)) {
    throw new HttpsError('permission-denied', 'Insufficient permissions');
  }

  try {
    logger.info(`Generating dashboard metrics for user ${request.auth.uid}`);

    const metrics: DashboardMetrics = {
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0,
      conversionRate: 0,
      topTours: [],
      revenueByMonth: [],
      userGrowth: []
    };

    // Execute multiple queries in parallel
    const [
      totalUsersResult,
      totalBookingsResult,
      revenueResult,
      topToursResult,
      revenueByMonthResult,
      userGrowthResult
    ] = await Promise.all([
      // Total users
      bigquery.query(`
        SELECT COUNT(*) as count
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}users\`
        WHERE isActive = true
      `),
      
      // Total bookings
      bigquery.query(`
        SELECT COUNT(*) as count
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\`
        WHERE status = 'confirmed'
      `),
      
      // Total revenue
      bigquery.query(`
        SELECT SUM(price_amount) as total_revenue
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\`
        WHERE status = 'confirmed' AND paymentStatus = 'paid'
      `),
      
      // Top tours
      bigquery.query(`
        SELECT 
          t.document_id,
          t.title,
          COUNT(b.document_id) as booking_count,
          SUM(b.price_amount) as total_revenue
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}tours\` t
        LEFT JOIN \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\` b
          ON t.document_id = b.tourId
        WHERE b.status = 'confirmed'
        GROUP BY t.document_id, t.title
        ORDER BY booking_count DESC
        LIMIT 10
      `),
      
      // Revenue by month
      bigquery.query(`
        SELECT 
          FORMAT_DATE('%Y-%m', PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', createdAt)) as month,
          SUM(price_amount) as revenue
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\`
        WHERE status = 'confirmed' 
          AND paymentStatus = 'paid'
          AND PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', createdAt) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 12 MONTH)
        GROUP BY month
        ORDER BY month
      `),
      
      // User growth
      bigquery.query(`
        SELECT 
          FORMAT_DATE('%Y-%m', PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', createdAt)) as month,
          COUNT(*) as new_users
        FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}users\`
        WHERE PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', createdAt) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 12 MONTH)
        GROUP BY month
        ORDER BY month
      `)
    ]);

    // Process results
    metrics.totalUsers = totalUsersResult[0][0]?.count || 0;
    metrics.totalBookings = totalBookingsResult[0][0]?.count || 0;
    metrics.totalRevenue = revenueResult[0][0]?.total_revenue || 0;
    metrics.topTours = topToursResult[0] || [];
    metrics.revenueByMonth = revenueByMonthResult[0] || [];
    metrics.userGrowth = userGrowthResult[0] || [];

    // Calculate conversion rate
    if (metrics.totalUsers > 0) {
      metrics.conversionRate = (metrics.totalBookings / metrics.totalUsers) * 100;
    }

    logger.info('Dashboard metrics generated successfully');

    return {
      success: true,
      data: metrics,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to generate dashboard metrics:', error);
    throw new HttpsError('internal', `Failed to generate metrics: ${error}`);
  }
});

// Export data for external analysis
export const exportDataForAnalysis = onCall({
  memory: '1GiB',
  timeoutSeconds: 600
}, async (request: CallableRequest) => {
  const { format = 'csv', dateRange, filters } = request.data;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Verify user has admin role
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  try {
    logger.info(`Exporting data for analysis (${format}) for user ${request.auth.uid}`);

    // Build query based on filters
    let query = `
      SELECT 
        b.document_id as booking_id,
        b.userId,
        b.tourId,
        t.title as tour_title,
        t.category as tour_category,
        b.price_amount,
        b.price_currency,
        b.status,
        b.paymentStatus,
        b.createdAt as booking_date,
        b.bookingDate as tour_date,
        u.location_city as user_city,
        u.location_country as user_country
      FROM \`${bigquery.projectId}.${datasetId}.${tablePrefix}bookings\` b
      LEFT JOIN \`${bigquery.projectId}.${datasetId}.${tablePrefix}tours\` t
        ON b.tourId = t.document_id
      LEFT JOIN \`${bigquery.projectId}.${datasetId}.${tablePrefix}users\` u
        ON b.userId = u.document_id
      WHERE 1=1
    `;

    // Add date range filter
    if (dateRange) {
      query += ` AND PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', b.createdAt) 
                 BETWEEN PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', @startDate)
                 AND PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', @endDate)`;
    }

    // Add additional filters
    if (filters?.status) {
      query += ` AND b.status = @status`;
    }

    if (filters?.category) {
      query += ` AND t.category = @category`;
    }

    query += ` ORDER BY b.createdAt DESC LIMIT 10000`;

    // Execute export query
    const [rows] = await bigquery.query({
      query,
      params: {
        startDate: dateRange?.start || '2020-01-01T00:00:00Z',
        endDate: dateRange?.end || new Date().toISOString(),
        status: filters?.status,
        category: filters?.category
      }
    });

    // Generate export file URL (in real implementation, this would upload to Cloud Storage)
    const exportId = `export_${Date.now()}`;
    const exportUrl = `https://storage.googleapis.com/tourtrip-exports/${exportId}.${format}`;

    logger.info(`Data export completed: ${rows.length} records`);

    return {
      success: true,
      exportId,
      format,
      recordCount: rows.length,
      downloadUrl: exportUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Data export failed:', error);
    throw new HttpsError('internal', `Export failed: ${error}`);
  }
});
