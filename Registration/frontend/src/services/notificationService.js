// Central Dynamic Notification Service
const STORAGE_KEY = 'app_notifications_store';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'default_1',
    title: 'System Active & Ready',
    message: 'Event management platform operational. Live event feeds active.',
    icon: '⚡',
    category: 'system',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    read: false
  },
  {
    id: 'default_2',
    title: 'Platform Overview',
    message: 'Welcome to RTIH Events Portal.',
    icon: 'ℹ️',
    category: 'system',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    read: true
  }
];

export function getNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATIONS;
  } catch (e) {
    return DEFAULT_NOTIFICATIONS;
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications to localStorage', e);
  }
  // Dispatch custom event to update topbar bell badge and dropdown live everywhere
  window.dispatchEvent(new CustomEvent('app-notifications-updated'));
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - Number(timestamp);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function addNotification({ title, message, icon = '🔔', category = 'general' }) {
  const notifications = getNotifications();
  const newNotif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title,
    message,
    icon,
    category,
    timestamp: Date.now(),
    read: false
  };

  // Add to top of array
  notifications.unshift(newNotif);

  // Keep max 50 notifications
  if (notifications.length > 50) {
    notifications.pop();
  }

  saveNotifications(notifications);
  return newNotif;
}

export function getUnreadCount() {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

export function markAsRead(id) {
  const notifications = getNotifications();
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveNotifications(notifications);
  }
}

export function markAllAsRead() {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveNotifications(notifications);
}

export function clearAllNotifications() {
  saveNotifications([]);
}

// Convenient Action Helpers
export function notifyEventCreated(title) {
  return addNotification({
    title: 'New Event Created',
    message: `Event "${title || 'Untitled'}" was successfully created.`,
    icon: '📅',
    category: 'event'
  });
}

export function notifyEventUpdated(title) {
  return addNotification({
    title: 'Event Updated',
    message: `Event "${title || 'Untitled'}" details were modified.`,
    icon: '✏️',
    category: 'event'
  });
}

export function notifyEventDeleted(title) {
  return addNotification({
    title: 'Event Deleted',
    message: `Event "${title || 'Untitled'}" was deleted from the platform.`,
    icon: '🗑️',
    category: 'event'
  });
}

export function notifyRegistrationCreated(participantName, eventTitle) {
  return addNotification({
    title: 'New Registration Received',
    message: `${participantName || 'A participant'} registered for ${eventTitle || 'an event'}.`,
    icon: '📝',
    category: 'registration'
  });
}

export function notifyRegistrationDeleted(participantName) {
  return addNotification({
    title: 'Registration Cancelled',
    message: `Registration record for ${participantName || 'participant'} was removed.`,
    icon: '❌',
    category: 'registration'
  });
}

export function notifyAttendanceMarked(participantName, eventTitle) {
  return addNotification({
    title: 'Attendance Verified',
    message: `${participantName || 'Participant'} checked into ${eventTitle || 'event'}.`,
    icon: '📋',
    category: 'attendance'
  });
}

export function notifyKitIssued(participantName) {
  return addNotification({
    title: 'Welcome Kit Issued',
    message: `Kit claimed by ${participantName || 'Participant'}.`,
    icon: '🎁',
    category: 'kit'
  });
}

export function notifyFoodCouponRedeemed(participantName) {
  return addNotification({
    title: 'Food Coupon Redeemed',
    message: `Meal voucher redeemed by ${participantName || 'Participant'}.`,
    icon: '🍱',
    category: 'food'
  });
}

export function notifyFormCreated(title) {
  return addNotification({
    title: 'New Form Published',
    message: `Registration Form "${title || 'Untitled'}" created.`,
    icon: '📝',
    category: 'form'
  });
}

export function notifyFormDeleted(title) {
  return addNotification({
    title: 'Form Deleted',
    message: `Registration Form "${title || 'Untitled'}" deleted.`,
    icon: '🗑️',
    category: 'form'
  });
}

export function notifyFeedbackSubmitted(participantName) {
  return addNotification({
    title: 'Feedback Received',
    message: `Feedback submitted by ${participantName || 'Participant'}.`,
    icon: '💬',
    category: 'feedback'
  });
}
