# Sound Files for Notifications

## 📁 Required Files

Place the following sound files in this directory:

1. **new-order.mp3** - Plays when new order is received
   - Suggested: Pleasant notification sound (beep, bell)
   - Duration: 1-2 seconds
   - Volume: Medium

2. **waiter-call.mp3** - Plays when waiter is called
   - Suggested: More urgent sound (alert, ding-ding-ding)
   - Duration: 2-3 seconds  
   - Volume: Loud

## 🔊 Where to get sounds?

### Free Sound Libraries:
- https://freesound.org
- https://mixkit.co/free-sound-effects
- https://soundbible.com

### Recommended Sounds:

**For new-order.mp3:**
- Search: "notification bell"
- Search: "pleasant beep"
- Example: https://mixkit.co/free-sound-effects/bell/

**For waiter-call.mp3:**
- Search: "alert sound"
- Search: "urgent notification"
- Example: https://mixkit.co/free-sound-effects/alert/

## 🎵 Creating Custom Sounds

You can also record custom sounds:
1. Use Audacity (free audio editor)
2. Record or generate tone
3. Export as MP3
4. Place in this folder

## 📝 File Format

- **Format:** MP3 (recommended) or WAV
- **Bitrate:** 128kbps or higher
- **Sample Rate:** 44.1kHz
- **Max Size:** < 1MB each

## 🧪 Testing

After adding sound files:

1. Open browser console (F12)
2. Run:
```javascript
const audio = new Audio('/sounds/new-order.mp3');
audio.play();
```

You should hear the sound!

## ⚠️ Important Notes

- Sound files MUST be named exactly as specified above
- Browser will auto-play these (no permission needed for user interaction)
- Test on actual devices (desktop + mobile)
- Adjust volume in code if needed (`audio.volume = 0.8`)

## 🔇 Temporary Solution

If you don't have sound files yet, the app will still work - it just won't play sounds. The visual notifications will still appear.

To disable sound errors in console, comment out audio.play() lines in:
- `/app/[locale]/staff/page.tsx`


