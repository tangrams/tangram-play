/* global ga */
/**
 * Google Analytics event tracking documentation:
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
 */
export function trackGAEvent(category, action, label, value) {
  // Graceful return if Google Analytics is not loaded or is blocked by client.
  if (typeof ga === 'undefined') return;
  ga('send', 'event', category, action, label, value);
}
