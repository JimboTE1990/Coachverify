import { supabase } from './supabaseService';

export type AnalyticsEventType =
  | 'profile_view'
  | 'contact_click'
  | 'booking_click'
  | 'email_click'
  | 'phone_click';

interface AnalyticsEvent {
  coachId: string;
  eventType: AnalyticsEventType;
  visitorSessionId?: string;
  visitorIp?: string;
  metadata?: Record<string, any>;
}

interface AnalyticsSummary {
  totalProfileViews: number;
  uniqueProfileViews: number;
  totalContactClicks: number;
  totalBookingClicks: number;
  totalEmailClicks: number;
  totalPhoneClicks: number;
  viewsByDay: { date: string; count: number }[];
  recentEvents: {
    eventType: string;
    createdAt: string;
    metadata?: Record<string, any>;
  }[];
}

// Get or create session ID for visitor deduplication
const getVisitorSessionId = (): string => {
  const SESSION_KEY = 'coachdog_visitor_session';
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

// Track an analytics event
export const trackEvent = async (event: AnalyticsEvent): Promise<void> => {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        coach_id: event.coachId,
        event_type: event.eventType,
        visitor_session_id: event.visitorSessionId || getVisitorSessionId(),
        visitor_ip: event.visitorIp,
        metadata: event.metadata,
      });

    if (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  } catch (err) {
    console.error('[Analytics] Exception tracking event:', err);
  }
};

// Track profile view with deduplication
export const trackProfileView = async (coachId: string): Promise<void> => {
  const sessionId = getVisitorSessionId();
  const SESSION_VIEW_KEY = `coachdog_viewed_${coachId}`;

  // Check if this session has already viewed this profile
  const hasViewed = sessionStorage.getItem(SESSION_VIEW_KEY);

  if (!hasViewed) {
    // Track the view
    await trackEvent({
      coachId,
      eventType: 'profile_view',
      visitorSessionId: sessionId,
      metadata: {
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    // Mark this profile as viewed in this session
    sessionStorage.setItem(SESSION_VIEW_KEY, 'true');
  }
};

// Track contact click (email, phone, booking)
export const trackContactClick = async (
  coachId: string,
  contactType: 'email' | 'phone' | 'booking'
): Promise<void> => {
  const eventTypeMap = {
    email: 'email_click' as AnalyticsEventType,
    phone: 'phone_click' as AnalyticsEventType,
    booking: 'booking_click' as AnalyticsEventType,
  };

  await trackEvent({
    coachId,
    eventType: eventTypeMap[contactType],
    metadata: {
      contactType,
      timestamp: new Date().toISOString(),
    },
  });
};

// Get analytics summary for a coach
export const getAnalyticsSummary = async (coachId: string): Promise<AnalyticsSummary> => {
  try {
    // Get all events for this coach
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Analytics] Error fetching analytics:', error);
      throw error;
    }

    if (!events) {
      return {
        totalProfileViews: 0,
        uniqueProfileViews: 0,
        totalContactClicks: 0,
        totalBookingClicks: 0,
        totalEmailClicks: 0,
        totalPhoneClicks: 0,
        viewsByDay: [],
        recentEvents: [],
      };
    }

    // Calculate metrics
    const profileViews = events.filter(e => e.event_type === 'profile_view');
    const uniqueSessions = new Set(profileViews.map(e => e.visitor_session_id));

    const contactClicks = events.filter(e =>
      ['contact_click', 'email_click', 'phone_click', 'booking_click'].includes(e.event_type)
    );

    const bookingClicks = events.filter(e => e.event_type === 'booking_click');
    const emailClicks = events.filter(e => e.event_type === 'email_click');
    const phoneClicks = events.filter(e => e.event_type === 'phone_click');

    // Group views by day (last 30 days)
    const viewsByDay = profileViews.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);

      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }

      return acc;
    }, [] as { date: string; count: number }[]);

    // Sort by date
    viewsByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Get recent events (last 10)
    const recentEvents = events.slice(0, 10).map(e => ({
      eventType: e.event_type,
      createdAt: e.created_at,
      metadata: e.metadata,
    }));

    return {
      totalProfileViews: profileViews.length,
      uniqueProfileViews: uniqueSessions.size,
      totalContactClicks: contactClicks.length,
      totalBookingClicks: bookingClicks.length,
      totalEmailClicks: emailClicks.length,
      totalPhoneClicks: phoneClicks.length,
      viewsByDay,
      recentEvents,
    };
  } catch (err) {
    console.error('[Analytics] Exception fetching analytics summary:', err);
    throw err;
  }
};

// Get analytics for a date range
export const getAnalyticsForDateRange = async (
  coachId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsSummary> => {
  try {
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('coach_id', coachId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Analytics] Error fetching analytics for date range:', error);
      throw error;
    }

    // Use same logic as getAnalyticsSummary but with filtered events
    if (!events) {
      return {
        totalProfileViews: 0,
        uniqueProfileViews: 0,
        totalContactClicks: 0,
        totalBookingClicks: 0,
        totalEmailClicks: 0,
        totalPhoneClicks: 0,
        viewsByDay: [],
        recentEvents: [],
      };
    }

    const profileViews = events.filter(e => e.event_type === 'profile_view');
    const uniqueSessions = new Set(profileViews.map(e => e.visitor_session_id));

    const contactClicks = events.filter(e =>
      ['contact_click', 'email_click', 'phone_click', 'booking_click'].includes(e.event_type)
    );

    const bookingClicks = events.filter(e => e.event_type === 'booking_click');
    const emailClicks = events.filter(e => e.event_type === 'email_click');
    const phoneClicks = events.filter(e => e.event_type === 'phone_click');

    const viewsByDay = profileViews.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);

      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }

      return acc;
    }, [] as { date: string; count: number }[]);

    viewsByDay.sort((a, b) => a.date.localeCompare(b.date));

    const recentEvents = events.slice(0, 10).map(e => ({
      eventType: e.event_type,
      createdAt: e.created_at,
      metadata: e.metadata,
    }));

    return {
      totalProfileViews: profileViews.length,
      uniqueProfileViews: uniqueSessions.size,
      totalContactClicks: contactClicks.length,
      totalBookingClicks: bookingClicks.length,
      totalEmailClicks: emailClicks.length,
      totalPhoneClicks: phoneClicks.length,
      viewsByDay,
      recentEvents,
    };
  } catch (err) {
    console.error('[Analytics] Exception fetching analytics for date range:', err);
    throw err;
  }
};
