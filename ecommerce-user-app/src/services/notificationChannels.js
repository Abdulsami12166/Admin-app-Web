import { NativeModules, Platform } from 'react-native';

/**
 * Android Notification Channels Configuration
 * Required for Android 8 (API 26) and above
 * These define how notifications are displayed and behave
 */

const NotificationModule = NativeModules.NotificationModule || NativeModules.StoreNotification;

export const NOTIFICATION_CHANNELS = {
  ORDERS: {
    id: 'ecommerce_orders',
    name: 'Order Notifications',
    description: 'Notifications about order status updates',
    importance: 4, // high
    enableVibration: true,
    enableLights: true,
    lightColor: '#FF7A00', // Brand color
    soundUri: 'default',
  },
  CHATS: {
    id: 'ecommerce_chats',
    name: 'Chat Messages',
    description: 'Product chat and support messages',
    importance: 4, // high
    enableVibration: true,
    enableLights: true,
    lightColor: '#FF7A00',
    soundUri: 'default',
  },
  PRODUCTS: {
    id: 'ecommerce_products',
    name: 'Product Updates',
    description: 'Updates about products and offers',
    importance: 3, // normal
    enableVibration: false,
    enableLights: true,
    lightColor: '#FF7A00',
    soundUri: 'default',
  },
  SYSTEM: {
    id: 'ecommerce_system',
    name: 'System Messages',
    description: 'Admin and system announcements',
    importance: 3, // normal
    enableVibration: false,
    enableLights: false,
    soundUri: 'default',
  },
};

/**
 * Setup notification channels for Android
 * Must be called on app startup before sending any notifications
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  if (Platform.Version < 26) {
    // Android 8+ only
    return;
  }

  try {
    if (NotificationModule?.createNotificationChannels) {
      await NotificationModule.createNotificationChannels(
        Object.values(NOTIFICATION_CHANNELS)
      );
    }
  } catch (error) {
    console.error('Setup notification channels error:', error);
  }
};

/**
 * Get channel ID for notification type
 */
export const getChannelIdForType = (type) => {
  switch (type) {
    case 'new_order':
    case 'order_update':
    case 'order_delivered':
      return NOTIFICATION_CHANNELS.ORDERS.id;

    case 'chat_message':
    case 'product_message':
      return NOTIFICATION_CHANNELS.CHATS.id;

    case 'product_published':
    case 'product_update':
      return NOTIFICATION_CHANNELS.PRODUCTS.id;

    case 'admin_broadcast':
    case 'system':
      return NOTIFICATION_CHANNELS.SYSTEM.id;

    default:
      return NOTIFICATION_CHANNELS.SYSTEM.id;
  }
};

/**
 * Create custom notification channel
 */
export const createNotificationChannel = async (channel) => {
  if (Platform.OS !== 'android' || Platform.Version < 26) {
    return;
  }

  try {
    if (NotificationModule?.createNotificationChannels) {
      await NotificationModule.createNotificationChannels([channel]);
    }
  } catch (error) {
    console.error('Create notification channel error:', error);
  }
};
