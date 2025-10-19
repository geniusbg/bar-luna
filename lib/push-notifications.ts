// Web Push Notifications - Client Side

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// Convert base64 to Uint8Array (required for VAPID key)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported() {
  const hasSupport = 'serviceWorker' in navigator && 'PushManager' in window;
  
  // Additional check for iOS - needs HTTPS in production
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('192.168');
  
  const isHTTPS = window.location.protocol === 'https:';
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  
  // iOS needs HTTPS (except localhost sometimes)
  if (isIOS && !isHTTPS && !isLocalhost) {
    return false;
  }
  
  return hasSupport;
}

// Get push support details for error messages
export function getPushSupportDetails() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isHTTPS = window.location.protocol === 'https:';
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  
  return {
    isIOS,
    isHTTPS,
    hasServiceWorker,
    hasPushManager,
    isSupported: isPushSupported()
  };
}

// Check if already subscribed
export async function isSubscribed() {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Check subscription error:', error);
    return false;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  try {
    // Check support
    if (!isPushSupported()) {
      throw new Error('Push notifications not supported');
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Get device info
    const deviceName = getDeviceName();
    const userAgent = navigator.userAgent;

    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceName,
        userAgent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    const result = await response.json();
    console.log('✅ Push subscription saved:', result.subscriptionId);

    return { success: true, subscription };

  } catch (error) {
    console.error('Subscribe to push error:', error);
    throw error;
  }
}

// Unsubscribe from push
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify server
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }

    return true;
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return false;
  }
}

// Helper to get device name
function getDeviceName() {
  const ua = navigator.userAgent;
  
  if (/Android/i.test(ua)) {
    return 'Android Phone';
  } else if (/iPhone/i.test(ua)) {
    return 'iPhone';
  } else if (/iPad/i.test(ua)) {
    return 'iPad';
  } else if (/Windows/i.test(ua)) {
    return 'Windows PC';
  } else if (/Mac/i.test(ua)) {
    return 'Mac';
  } else {
    return 'Unknown Device';
  }
}

// Show test notification
export async function showTestNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Luna Bar Test', {
      body: 'Notifications are working! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200]
    } as NotificationOptions & { vibrate?: number[] });
  }
}

