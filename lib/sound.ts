// Sound utility functions
// Uses Web Audio API to generate beeps (no MP3 files needed!)

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play notification beep (for new orders)
 * Pleasant, non-intrusive sound
 */
export function playOrderNotification() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create pleasant two-tone beep
    const now = ctx.currentTime;
    
    // First tone (higher)
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(800, now); // 800 Hz
    gainNode1.gain.setValueAtTime(0.3, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.2);
    
    // Second tone (lower, delayed)
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(600, now + 0.15); // 600 Hz
    gainNode2.gain.setValueAtTime(0.3, now + 0.15);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    
    oscillator2.start(now + 0.15);
    oscillator2.stop(now + 0.35);
    
  } catch (error) {
    console.error('Sound error:', error);
  }
}

/**
 * Play urgent alert (for waiter calls)
 * Louder, more attention-grabbing
 */
export function playUrgentAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Triple beep - urgent!
    for (let i = 0; i < 3; i++) {
      const startTime = now + (i * 0.25);
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'square'; // Harsher sound
      oscillator.frequency.setValueAtTime(1000, startTime); // 1000 Hz
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    }
    
  } catch (error) {
    console.error('Sound error:', error);
  }
}

/**
 * Try to play MP3 file, fallback to beep if not found
 */
export async function playSound(type: 'order' | 'urgent') {
  const soundFile = type === 'order' ? '/sounds/new-order.mp3' : '/sounds/waiter-call.mp3';
  
  try {
    // Try to play MP3 first
    const audio = new Audio(soundFile);
    audio.volume = type === 'urgent' ? 0.8 : 0.6;
    await audio.play();
  } catch (error) {
    // Fallback to generated beep
    console.log('MP3 not found, using generated beep');
    if (type === 'order') {
      playOrderNotification();
    } else {
      playUrgentAlert();
    }
  }
}

