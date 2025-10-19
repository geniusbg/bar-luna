# Client Information

## Luna Bar & Coffee

**Location:** ул. "Александровска" 97, Русе, България

**Contact:**
- Phone: 089 853 6542
- Instagram: @luna2224
- Facebook: [LUNA Bar Coffee](https://www.facebook.com/p/LUNA-Bar-Coffee-61556563603176/?locale=bg_BG)

**Business Type:** Bar, Coffee, Lunch, Shisha

**Current Menu:** [OddMenu Temporary Menu](https://oddmenu.com/bg/p/luna)

**Description:** 𝘣𝘢𝘳 𝘤𝘰𝘧𝘧𝘦𝘦 𝘭𝘶𝘯𝘤𝘩 𝘴𝘩𝘪𝘴𝘩𝘢 & 𝘨𝘰𝘰𝘥 𝘮𝘰𝘰𝘥

## Menu Categories (from current menu)

- Напитки (Drinks)
  - Алкохол (Alcohol)
  - Кафе Costa
  - Кафе Richard
  - Топли Напитки (Hot Drinks)
  - Студени Напитки (Cold Drinks)
  - Фреш (Fresh Juices)
  - Безалкохолни (Non-alcoholic)
  - Лимонади (Lemonades)

---

## Client Requirements & Preferences

### **Language & Currency**
- ✅ 3 languages: Bulgarian (primary), English, German
- ✅ Dual currency display: BGN and EUR together
- ✅ Fixed rate: €1 = 1.95583 BGN
- **Reason:** Bulgaria adopting Euro in 2026, transition period requirement

### **Ordering System**
- ✅ QR codes on each table (30 tables total)
- ✅ Customer can browse menu and order via phone
- ✅ Customer can call waiter for payment (cash/card) or help
- ✅ Orders appear on bar computer in real-time
- ✅ Sound notifications for staff
- ✅ Notifications visible on screen (no auto-hide)

### **Product Management**
- ✅ Admin can add products with images
- ✅ Categorization of drinks/food
- ✅ Three visibility states:
  - **Available:** Normal display
  - **Unavailable:** Show with badge, can't order
  - **Hidden:** Don't show in menu at all
- ✅ Featured products with star icon
- ✅ Order/sort control

### **UI/UX Preferences**
- ✅ Beautiful main page
- ✅ Menu with category tabs (not all categories at once)
- ✅ Toast notifications instead of alerts
- ✅ Loading indicators on all actions
- ✅ Notification queue system (no scrolling)
- ✅ Separate tabs for active/completed orders
- ✅ Uniform notification sizes

### **Infrastructure**
- ✅ PostgreSQL database (self-hosted: 66.29.142.10)
- ✅ Local image storage (no cloud services)
- ✅ Expects ~30 tables
- ⏳ Future POS integration with Hype software (deferred)

### **Deployment Target**
- Bar computer (staff dashboard)
- Waiter phones (web-based)
- Customer phones (QR code access)

---

## Client Feedback History

**Key iterations based on feedback:**
1. "банера който се появява... не трябва да изчезва автоматично" → Removed auto-dismiss
2. "може ли да не се вижда това отдолу когато примигва" → Dark overlay
3. "скриват се когато се съберат няколко" → Dynamic grid layout
4. "нека са и за двете" (tabs) → Added tabs for both orders and calls
5. "банерите... нека са с еднакви размери" → Uniform width classes
6. "Цените трябва да се виждат и двете" → Always show BGN/EUR together
7. "менюто определено искам да е на табове" → Category tabs implementation

**Communication style:** Direct, prefers Bulgarian, technical understanding


