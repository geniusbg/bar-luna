# 𝐋.𝐔.𝐍.𝐀 🌙 Bar & Coffee - QR Ordering System

Modern QR-based ordering system for Luna Bar in Ruse, Bulgaria.

## 🌟 Features

### For Customers
- 📱 **QR Code Ordering** - Scan table QR, browse menu, order
- 🔐 **Session Security** - 3-hour session tokens for secure ordering
- 🌍 **3 Languages** - Bulgarian, English, German
- 💰 **Dual Currency** - BGN & EUR with real-time toggle
- 🛒 **Shopping Cart** - Add items, adjust quantities
- 🔔 **Call Waiter** - Request payment (cash/card) or assistance
- 📢 **Real-time Updates** - Receive instant notifications when order status changes
- ⚠️ **Approval System** - Orders requiring approval show clear status with items list

### For Staff
- ⚡ **Real-time Dashboard** - Orders appear instantly (no refresh!)
- 🔊 **Sound Alerts** - Audible notifications for new orders/calls
- 📊 **Order Management** - Track status (Pending → Preparing → Ready → Complete)
- 🚨 **Urgent Notifications** - Priority alerts for payment requests
- 📱 **Multi-device** - Works on desktop + mobile simultaneously
- ✅ **Order Approvals** - Approve or reject orders requiring admin approval
- ⚠️ **Approval Banner** - Always-visible sticky banner for pending approvals

### For Admins
- 🍸 **Product Management** - Add/edit menu items in 3 languages
- 🎉 **Event Management** - Luna events + partner promotions
- 📱 **QR Generation** - Generate & print QR codes for all tables
- 🔗 **QR Redirects** - Manage dynamic redirect URLs for QR codes (no need to reprint when changing URLs)
- 🕐 **Working Hours** - Set working hours for each day of the week
- 📊 **Analytics Dashboard** - View statistics
- ⚠️ **Order Approval System** - Monitor and approve suspicious orders (>5 orders per table in 5 minutes)
- 🔒 **Security Features** - Rate limiting, session validation, auto-reject expired approvals
- 🛡️ **Security Settings Panel** - Configure threshold, time window, session duration, auto-reject timer

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Pusher Channels
- **Styling:** Tailwind CSS
- **i18n:** next-intl
- **QR Codes:** qrcode library
- **PWA:** Service Workers, Offline Support, Push Notifications

## 📱 Mobile & PWA Support

### Service Worker & Offline Mode
- ✅ **Android**: Full Service Worker support (localhost + production)
- ⚠️ **iOS**: Service Worker only on **HTTPS** (production)
  - On `http://localhost` → May work
  - On `http://192.168.x.x` → **Does NOT work**
  - **Solution**: Deploy to production (HTTPS) or use Android for testing

### Version Display
- **SW button** (bottom-right corner) shows current Service Worker version
- 🟢 Green dot = SW working perfectly
- 🟠 Orange dot = SW limited (iOS HTTP fallback)

### Offline Detection
- iOS uses fetch interceptor fallback when SW not available
- Health checks every 5 seconds on iOS (10 on Android)
- Full documentation: `OFFLINE_FUNCTIONALITY.md`

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (local or remote)
- Pusher account (free tier)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file (copy from `env.example`):
```env
DATABASE_URL="postgresql://user:password@host:5432/luna_bar"
PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=eu
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=random_secret_string
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
APP_NAME=bar-luna
PORT=4000
```

### 3. Setup Database
```bash
# Run migration SQL
node setup-database.js
```

Or manually run `SIMPLE_MIGRATION.sql` in your PostgreSQL client.

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000/bg

---

## 📁 Project Structure

```
luna/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx              # Home page
│   │   ├── menu/                 # Public menu
│   │   ├── events/               # Events page
│   │   ├── contact/              # Contact page
│   │   ├── order/                # 🆕 Customer ordering
│   │   │   ├── page.tsx          # QR landing + menu + cart
│   │   │   └── call-waiter/      # Call waiter page
│   │   ├── staff/                # 🆕 Staff dashboard
│   │   │   └── page.tsx          # Real-time orders & calls
│   │   └── admin/                # Admin panel
│   │       ├── products/
│   │       ├── events/
│   │       └── qr/               # 🆕 QR code generation
│   └── api/
│       ├── menu/                 # Menu API
│       ├── orders/               # 🆕 Order CRUD + real-time
│       ├── waiter-call/          # 🆕 Waiter calls
│       └── qr/                   # 🆕 QR generation
├── components/
│   ├── Navigation.tsx
│   ├── Price.tsx                 # Currency-aware pricing
│   └── ...
├── lib/
│   ├── prisma.ts                 # Database client
│   ├── pusher-server.ts          # 🆕 Real-time server
│   ├── pusher-client.ts          # 🆕 Real-time client
│   └── currency.ts               # BGN/EUR conversion
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
└── public/
    └── sounds/                   # 🆕 Notification sounds
        ├── new-order.mp3
        └── waiter-call.mp3
```

---

## 🎯 Usage

### Customer Flow (QR Ordering)

```
1. Customer scans QR code on table
   ↓
2. Lands on /order?table=5
   ↓
3. Browses menu, adds to cart
   ↓
4. Submits order
   ↓
5. Staff receives INSTANT notification
```

### Staff Flow

```
1. Staff opens /bg/staff on computer/tablet
   ↓
2. Leaves page open
   ↓
3. When order comes:
   - 🔊 Sound plays
   - 🔔 Notification pops up
   - 📋 Order card appears
   - NO REFRESH NEEDED!
   ↓
4. Staff updates status:
   Pending → Preparing → Ready → Completed
```

### Waiter Call Flow

```
1. Customer clicks "Call Waiter"
   ↓
2. Selects: Cash / Card / Help
   ↓
3. Staff receives URGENT notification
   - 🚨 Red popup
   - 🔊 Louder sound
   - 🔴 Shows in priority section
   ↓
4. Waiter clicks "Отивам"
   ↓
5. Goes to table
```

---

## 🔧 Configuration

### Database Schema

10 tables created:
- `categories` - Menu categories (8 pre-loaded)
- `products` - Menu items (17 test products)
- `events` - Bar events
- `bar_tables` - Physical tables (30 pre-loaded with QR URLs)
- `orders` - Customer orders
- `order_items` - Products in orders
- `waiter_calls` - Waiter notifications
- `users` - Admin and staff accounts
- `pending_order_approvals` - Orders requiring admin approval
- `push_subscriptions` - Web push notification subscriptions
- `hype_sync_log` - Future Hype POS integration

### Currency System

Fixed rate: **1 EUR = 1.95583 BGN**

Prices stored in BGN, auto-converted to EUR.

### Real-time Channels

**Pusher channels:**
- `staff-channel` - Staff notifications
- `admin-channel` - Admin notifications
- `table-{N}` - Table-specific client notifications

**Events:**
- `new-order` - New customer order
- `waiter-call` - Waiter called from table
- `order-status-change` - Order status updated (staff)
- `order-status-update` - Order status updated (client)
- `order-approval-needed` - Order requires approval
- `order-approval-status` - Approval status changed
- `auto-rejections` - Auto-rejected expired approvals

---

## 📱 Pages & Routes

### Public Pages
- `/` → Redirects to `/bg`
- `/{locale}` - Home page
- `/{locale}/menu` - Browse menu
- `/{locale}/events` - Upcoming events
- `/{locale}/contact` - Contact info

### Customer Ordering
- `/order?table=N` - QR landing page with menu & cart
- `/order/call-waiter?table=N` - Call waiter

### Staff Interface
- `/{locale}/staff` - **Main staff dashboard** (keep open!)

### Admin Panel
- `/{locale}/admin` - Dashboard
- `/{locale}/admin/products` - Manage products
- `/{locale}/admin/events` - Manage events
- `/{locale}/admin/qr` - Generate & print QR codes

---

## 🔊 Sound Notifications

Place MP3 files in `public/sounds/`:

- **new-order.mp3** - Pleasant notification (for new orders)
- **waiter-call.mp3** - Urgent alert (for waiter calls)

**Download from:**
- https://mixkit.co/free-sound-effects/
- https://freesound.org

**Format:** MP3, <1MB, clear and loud

**See:** `public/sounds/README.md` for details

---

## 🔌 Future: Hype POS Integration

Architecture is **Hype-ready**:

- `hype_sync_log` table created
- API structure supports webhooks
- Product sync endpoints can be added
- Order forwarding to Hype available

**To activate:**
1. Contact Hype (https://hype.bg)
2. Get API credentials
3. Implement sync in `lib/hype.ts`
4. Enable automatic sync

**See:** `API_DOCUMENTATION.md` for integration details

---

## 🎨 UI/UX Features

- Beautiful gradient backgrounds
- Glassmorphism cards
- Smooth animations
- Responsive design (mobile-first)
- Touch-friendly buttons
- Clear visual hierarchy
- Urgent notifications stand out

---

## 🚀 Deployment

See `DEPLOYMENT.md` for production deployment guide.

**Recommended stack:**
- **Hosting:** Vercel (free tier)
- **Database:** Your current PostgreSQL server
- **Real-time:** Pusher (free tier - 200k msgs/day)
- **Domain:** lunabar.bg (suggested)

---

## 📚 Documentation

- **README.md** (this file) - Overview
- **QUICK_START.md** - Setup instructions
- **TESTING_GUIDE.md** - How to test features
- **DEPLOYMENT.md** - Production deployment
- **API_DOCUMENTATION.md** - API reference
- **POSTGRES_SETUP.md** - Database setup
- **PUSHER_SETUP_GUIDE.md** - Pusher configuration
- **public/sounds/README.md** - Sound files guide

---

## 🎯 Key Achievements

✅ **QR-based ordering** - Contactless, modern  
✅ **Session security** - 3-hour tokens, table validation  
✅ **Rate limiting** - Prevents spam orders (5 orders per table per 5 minutes)  
✅ **Approval system** - Admin/staff can approve/reject suspicious orders  
✅ **Real-time notifications** - Instant, no refresh  
✅ **Multi-language** - BG/EN/DE support  
✅ **Dual currency** - BGN/EUR toggle  
✅ **Staff dashboard** - Live order management  
✅ **Waiter calls** - Urgent payment requests  
✅ **Web push notifications** - Works even when app is closed  
✅ **30 Tables** - Pre-configured with QR codes  
✅ **Responsive** - Works on all devices  
✅ **Hype-ready** - Easy POS integration  

---

## 💰 Cost Breakdown

### Development: **$0**
- PostgreSQL: Self-hosted
- Pusher: Free tier
- Next.js: Open source

### Production: **~$5-10/month**
- Hosting: Vercel Free tier
- Database: Current server (already have)
- Pusher: Free tier (sufficient)
- Domain: ~$10/year

**Total annual cost: ~$60-120**

---

## 📞 Support

### For Setup Issues:
- See `QUICK_START.md`
- See `TESTING_GUIDE.md`

### For Deployment:
- See `DEPLOYMENT.md`

### For API Integration:
- See `API_DOCUMENTATION.md`

---

## 🏆 Credits

**Client:** Luna Bar & Coffee, Русе  
**Location:** ул. "Александровска" 97  
**Phone:** 089 853 6542  
**Instagram:** @luna2224  

**Built with:** Next.js, PostgreSQL, Prisma, Pusher, TypeScript

---

## 📝 License

Proprietary - Luna Bar & Coffee © 2024

---

**🎉 Ready to revolutionize your bar service! 🌙**

For questions or support, check the documentation files listed above.
