// Debug invoker removed — provide no-op placeholders so existing code that
// references this module won't crash if accidentally imported.
export function registerNotificationHandler() {
  // no-op
}

export async function invokeNotificationResponse() {
  throw new Error('notificationInvoker has been removed in production builds');
}
