// Simple in-memory tracking for checkout abandonment
// For production, use Redis or a database

interface CheckoutSession {
  timestamp: number;
  notified: boolean;
}

// Store checkout sessions: { sessionId: { timestamp, notified } }
const checkoutSessions = new Map<string, CheckoutSession>();

// Track when someone initiates checkout
export function trackCheckoutInitiated(sessionId: string) {
  checkoutSessions.set(sessionId, {
    timestamp: Date.now(),
    notified: false,
  });

  console.log(`Tracking checkout session: ${sessionId}`);
}

// Mark session as completed (payment succeeded or membership activated)
export function markCheckoutCompleted(sessionId: string) {
  checkoutSessions.delete(sessionId);
  console.log(`Checkout completed: ${sessionId}`);
}

// Get abandoned checkouts (older than 30 minutes and not notified)
export function getAbandonedCheckouts(): string[] {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  const abandoned: string[] = [];

  for (const [sessionId, session] of checkoutSessions.entries()) {
    if (session.timestamp < thirtyMinutesAgo && !session.notified) {
      abandoned.push(sessionId);
      session.notified = true; // Mark as notified
    }
  }

  return abandoned;
}

// Clean up old sessions (older than 24 hours)
export function cleanupOldSessions() {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const [sessionId, session] of checkoutSessions.entries()) {
    if (session.timestamp < twentyFourHoursAgo) {
      checkoutSessions.delete(sessionId);
    }
  }

  console.log(`Cleaned up old checkout sessions. Active sessions: ${checkoutSessions.size}`);
}
