import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

// Track custom event
export const trackCustomEvent = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { eventName, eventData, userId } = request.data;
    const authUserId = request.auth?.uid;

    if (!eventName) {
      throw new HttpsError('invalid-argument', 'Event name is required');
    }

    try {
      const db = getFirestore();

      await db.collection('analytics_events').add({
        eventName,
        eventData: eventData || {},
        userId: userId || authUserId,
        sessionId: eventData?.sessionId,
        timestamp: new Date(),
        ipAddress: request.rawRequest.ip,
        userAgent: request.rawRequest.headers['user-agent'],
        source: 'firebase_function',
      });

      return { success: true };

    } catch (error) {
      logger.error('Error tracking custom event:', error);
      throw new HttpsError('internal', 'Failed to track event');
    }
  }
);

// Track booking events
export const trackBookingEvent = onDocumentCreated(
  'bookings/{bookingId}',
  async (event: FirestoreEvent<any, any>) => {
    const booking = event.data?.data();
    if (!booking) return;

    const db = getFirestore();

    try {
      // Track booking created
      await db.collection('analytics_events').add({
        eventName: 'booking_created',
        eventData: {
          bookingId: event.params.bookingId,
          tourId: booking.tourId,
          userId: booking.userId,
          totalAmount: booking.totalAmount,
          participants: booking.participants?.length || 1,
          bookingDate: booking.createdAt,
        },
        userId: booking.userId,
        timestamp: new Date(),
        source: 'firestore_trigger',
      });

      // Track revenue
      await db.collection('analytics_events').add({
        eventName: 'revenue',
        eventData: {
          amount: booking.totalAmount,
          currency: 'TRY',
          type: 'booking',
          bookingId: event.params.bookingId,
          tourId: booking.tourId,
        },
        userId: booking.userId,
        timestamp: new Date(),
        source: 'firestore_trigger',
      });

    } catch (error) {
      logger.error('Error tracking booking event:', error);
    }
  }
);

// Get analytics data
export const getAnalyticsData = onCall(
  {
    region: 'europe-west1',
    memory: '1GiB',
  },
  async (request: CallableRequest) => {
    const { startDate, endDate, metrics, dimensions } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const db = getFirestore();

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get events in date range
      const eventsQuery = await db.collection('analytics_events')
        .where('timestamp', '>=', start)
        .where('timestamp', '<=', end)
        .get();

      const events = eventsQuery.docs.map((doc: any) => doc.data());

      // Process analytics data
      const analytics = {
        summary: {
          totalEvents: events.length,
          uniqueUsers: new Set(events.map((e: any) => e.userId).filter(Boolean)).size,
          dateRange: { start, end },
        },
        metrics: {} as any,
        charts: {} as any,
      };

      // Calculate metrics
      if (metrics?.includes('revenue')) {
        const revenueEvents = events.filter((e: any) => e.eventName === 'revenue');
        analytics.metrics.revenue = {
          total: revenueEvents.reduce((sum: number, e: any) => sum + (e.eventData?.amount || 0), 0),
          count: revenueEvents.length,
          average: revenueEvents.length > 0
            ? revenueEvents.reduce((sum: number, e: any) => sum + (e.eventData?.amount || 0), 0) / revenueEvents.length
            : 0,
        };
      }

      if (metrics?.includes('bookings')) {
        const bookingEvents = events.filter((e: any) => e.eventName === 'booking_created');
        analytics.metrics.bookings = {
          total: bookingEvents.length,
          revenue: bookingEvents.reduce((sum: number, e: any) => sum + (e.eventData?.totalAmount || 0), 0),
          averageValue: bookingEvents.length > 0
            ? bookingEvents.reduce((sum: number, e: any) => sum + (e.eventData?.totalAmount || 0), 0) / bookingEvents.length
            : 0,
        };
      }

      // Generate charts data
      if (dimensions?.includes('daily')) {
        analytics.charts.dailyRevenue = generateDailyRevenueChart(events, start, end);
        analytics.charts.dailyBookings = generateDailyBookingsChart(events, start, end);
      }

      if (dimensions?.includes('hourly')) {
        analytics.charts.hourlyActivity = generateHourlyActivityChart(events);
      }

      return analytics;

    } catch (error) {
      logger.error('Error getting analytics data:', error);
      throw new HttpsError('internal', 'Failed to get analytics data');
    }
  }
);

// Get user behavior analytics
export const getUserBehaviorAnalytics = onCall(
  {
    region: 'europe-west1',
  },
  async (request: CallableRequest) => {
    const { userId: targetUserId, days = 30 } = request.data;
    const authUserId = request.auth?.uid;

    if (!authUserId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const db = getFirestore();

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get user's events
      const userEventsQuery = await db.collection('analytics_events')
        .where('userId', '==', targetUserId || authUserId)
        .where('timestamp', '>=', startDate)
        .orderBy('timestamp', 'desc')
        .get();

      const events = userEventsQuery.docs.map((doc: any) => doc.data());

      // Analyze user behavior
      const behavior = {
        totalEvents: events.length,
        eventTypes: {} as Record<string, number>,
        sessionCount: new Set(events.map((e: any) => e.eventData?.sessionId).filter(Boolean)).size,
        averageSessionDuration: 0,
        topPages: [] as any[],
        conversionRate: 0,
        lastActivity: events.length > 0 ? events[0].timestamp : null,
      };

      // Count event types
      events.forEach((event: any) => {
        behavior.eventTypes[event.eventName] = (behavior.eventTypes[event.eventName] || 0) + 1;
      });

      // Calculate conversion rate (bookings vs page views)
      const pageViews = events.filter((e: any) => e.eventName === 'page_view').length;
      const bookings = events.filter((e: any) => e.eventName === 'booking_created').length;
      behavior.conversionRate = pageViews > 0 ? (bookings / pageViews) * 100 : 0;

      return behavior;

    } catch (error) {
      logger.error('Error getting user behavior analytics:', error);
      throw new HttpsError('internal', 'Failed to get user behavior analytics');
    }
  }
);

// Generate reports
export const generateAnalyticsReport = onCall(
  {
    region: 'europe-west1',
    memory: '1GiB',
  },
  async (request: CallableRequest) => {
    const { reportType, dateRange, filters } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!reportType) {
      throw new HttpsError('invalid-argument', 'Report type is required');
    }

    try {
      const db = getFirestore();

      const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

      // Get relevant events
      let eventsQuery = db.collection('analytics_events')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);

      if (filters?.eventTypes) {
        eventsQuery = eventsQuery.where('eventName', 'in', filters.eventTypes);
      }

      const eventsSnapshot = await eventsQuery.get();
      const events = eventsSnapshot.docs.map((doc: any) => doc.data());

      // Generate report based on type
      let report = {};

      switch (reportType) {
        case 'revenue':
          report = generateRevenueReport(events);
          break;
        case 'user_engagement':
          report = generateEngagementReport(events);
          break;
        case 'conversion':
          report = generateConversionReport(events);
          break;
        case 'geographic':
          report = generateGeographicReport(events);
          break;
        default:
          throw new HttpsError('invalid-argument', 'Invalid report type');
      }

      // Store report
      const reportRef = await db.collection('analytics_reports').add({
        reportType,
        dateRange: { start: startDate, end: endDate },
        filters,
        data: report,
        generatedBy: userId,
        generatedAt: new Date(),
      });

      return {
        reportId: reportRef.id,
        report,
        generatedAt: new Date(),
      };

    } catch (error) {
      logger.error('Error generating analytics report:', error);
      throw new HttpsError('internal', 'Failed to generate report');
    }
  }
);

// Helper functions
function generateDailyRevenueChart(events: any[], start: Date, end: Date) {
  const chart = [];
  const revenueEvents = events.filter(e => e.eventName === 'revenue');

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayRevenue = revenueEvents
      .filter(e => {
        const eventDate = e.timestamp.toDate();
        return eventDate.toDateString() === date.toDateString();
      })
      .reduce((sum, e) => sum + (e.eventData?.amount || 0), 0);

    chart.push({
      date: date.toISOString().split('T')[0],
      revenue: dayRevenue,
    });
  }

  return chart;
}

function generateDailyBookingsChart(events: any[], start: Date, end: Date) {
  const chart = [];
  const bookingEvents = events.filter(e => e.eventName === 'booking_created');

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayBookings = bookingEvents.filter(e => {
      const eventDate = e.timestamp.toDate();
      return eventDate.toDateString() === date.toDateString();
    }).length;

    chart.push({
      date: date.toISOString().split('T')[0],
      bookings: dayBookings,
    });
  }

  return chart;
}

function generateHourlyActivityChart(events: any[]) {
  const chart = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    events: 0,
  }));

  events.forEach(event => {
    const hour = event.timestamp.toDate().getHours();
    chart[hour].events++;
  });

  return chart;
}

function generateRevenueReport(events: any[]) {
  const revenueEvents = events.filter(e => e.eventName === 'revenue');

  return {
    totalRevenue: revenueEvents.reduce((sum, e) => sum + (e.eventData?.amount || 0), 0),
    transactionCount: revenueEvents.length,
    averageTransactionValue: revenueEvents.length > 0
      ? revenueEvents.reduce((sum, e) => sum + (e.eventData?.amount || 0), 0) / revenueEvents.length
      : 0,
    revenueByType: revenueEvents.reduce((acc, e) => {
      const type = e.eventData?.type || 'other';
      acc[type] = (acc[type] || 0) + (e.eventData?.amount || 0);
      return acc;
    }, {}),
  };
}

function generateEngagementReport(events: any[]) {
  const pageViews = events.filter(e => e.eventName === 'page_view').length;
  const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
  const sessions = new Set(events.map(e => e.eventData?.sessionId).filter(Boolean)).size;

  return {
    pageViews,
    uniqueUsers,
    sessions,
    averageSessionDuration: sessions > 0 ? events.length / sessions : 0,
    bounceRate: sessions > 0 ? (sessions - uniqueUsers) / sessions * 100 : 0,
    topPages: events
      .filter(e => e.eventName === 'page_view')
      .reduce((acc, e) => {
        const page = e.eventData?.page || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {}),
  };
}

function generateConversionReport(events: any[]) {
  const pageViews = events.filter(e => e.eventName === 'page_view').length;
  const bookings = events.filter(e => e.eventName === 'booking_created').length;
  const signups = events.filter(e => e.eventName === 'user_signup').length;

  return {
    pageViews,
    bookings,
    signups,
    bookingConversionRate: pageViews > 0 ? (bookings / pageViews) * 100 : 0,
    signupConversionRate: pageViews > 0 ? (signups / pageViews) * 100 : 0,
    conversionFunnel: {
      visitors: pageViews,
      signups,
      bookings,
    },
  };
}

function generateGeographicReport(events: any[]) {
  const locationData = events.reduce((acc, e) => {
    const country = e.eventData?.country || 'Unknown';
    const city = e.eventData?.city || 'Unknown';

    if (!acc[country]) acc[country] = {};
    if (!acc[country][city]) acc[country][city] = 0;
    acc[country][city]++;

    return acc;
  }, {} as Record<string, Record<string, number>>);

  return {
    countries: Object.keys(locationData).length,
    cities: Object.values(locationData).reduce((sum: number, cities: any) =>
      sum + Object.keys(cities).length, 0),
    topCountries: Object.entries(locationData)
      .map(([country, cities]) => ({
        country,
        visitors: Object.values(cities as Record<string, number>).reduce((sum: number, count: number) => sum + count, 0),
      }))
      .sort((a: any, b: any) => b.visitors - a.visitors)
      .slice(0, 10),
  };
}