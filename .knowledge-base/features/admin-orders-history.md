# Admin Orders & History Feature

## Context
Luna Bar admin panel needs orders management and history to:
- Monitor daily revenue
- Track order patterns
- Identify popular products
- Analyze table performance
- Generate reports

## User Stories

### 1. **View Active Orders (Real-time)**
**Actor**: Admin  
**Need**: Monitor current orders like Staff, but with overview perspective  
**Why**: Ensure smooth operations, intervene if needed

**Scenario**:
- Admin opens dashboard
- Sees ALL active orders across all tables (not just new ones)
- Can filter by status: Pending / Preparing / Ready
- Can manually mark orders as completed (override staff)

---

### 2. **View Order History (Daily/Weekly/Monthly)**
**Actor**: Admin  
**Need**: Analyze completed orders for business intelligence  
**Why**: Identify best-selling products, peak hours, revenue trends

**Scenario**:
- Admin clicks "Orders History" tab
- Sees filters:
  - Date range (today, this week, this month, custom)
  - Table number
  - Status
  - Sort by: time, total, table
- Displays paginated list with:
  - Order #, Table, Time, Total, Items count
  - Click to expand full details
- Shows daily total revenue at top

---

### 3. **Order Details Modal**
**Actor**: Admin  
**Need**: See full order information  
**Why**: Customer dispute resolution, staff verification

**Scenario**:
- Admin clicks on any order
- Modal shows:
  - Full item list with prices
  - Order timestamps (created, preparing, ready, completed)
  - Table info
  - Staff who handled it (future)
  - Notes (if any)

---

### 4. **Revenue Statistics**
**Actor**: Owner/Manager  
**Need**: Business KPIs at a glance  
**Why**: Make informed decisions

**Display**:
- Today's revenue (BGN/EUR)
- This week's revenue
- This month's revenue
- Top 5 products (by quantity sold)
- Peak hours chart
- Table utilization %

---

### 5. **Export Reports**
**Actor**: Owner  
**Need**: Financial records for accounting  
**Why**: Tax compliance, business analysis

**Scenario**:
- Admin clicks "Export" button
- Chooses date range
- Downloads CSV/Excel with:
  - All orders in period
  - Product sales summary
  - Revenue by day

---

## Technical Considerations

### API Endpoints Needed
- `GET /api/orders/history` - with filters (date, table, status)
- `GET /api/stats/revenue` - revenue metrics
- `GET /api/stats/products` - product sales stats
- `GET /api/stats/tables` - table performance

### UI Components
1. **Orders Tab** (similar to Staff, but admin-focused)
2. **History Table** (paginated, sortable)
3. **Stats Dashboard** (charts, KPIs)
4. **Order Details Modal** (full info)
5. **Export Button** (CSV generation)

### Performance
- Implement pagination (50 orders per page)
- Cache revenue stats (5 min)
- Lazy load order items
- Use Pusher for real-time order updates (like Staff)

### Permissions
- Only ADMIN and SUPER_ADMIN roles
- STAFF redirects to `/staff` panel

---

## Implementation Status

### ✅ Completed (Phase 1-3)

1. ✅ **Orders Tab in Admin** - с 3 под-табове:
   - Active orders (real-time)
   - History (с филтри)
   - Statistics (dashboard)

2. ✅ **API Endpoints**:
   - `GET /api/orders/history` - pagination, filters, revenue summary
   - `GET /api/stats/revenue` - today, week, month, last 7 days chart
   - `GET /api/stats/products` - top products, category performance
   - `GET /api/stats/tables` - table utilization, revenue per table
   - `DELETE /api/orders/[id]/delete` - delete orders

3. ✅ **Features**:
   - Real-time updates с Pusher
   - Order details modal с delete опция
   - Filters: date range, table, status, sort
   - Pagination (50 orders/page)
   - Revenue statistics dashboard:
     - Today/Week/Month revenue cards
     - Last 7 days bar chart
     - Top 10 products table
     - Table performance stats
   - CSV Export (днешни завършени поръчки)

### 📝 User Preferences (Confirmed)
- ✅ Admin CAN delete orders
- ✅ CSV export format
- ✅ Default view: Today's orders
- ✅ Real-time updates: YES
- ✅ Statistics dashboard: YES with charts

---

## Files Created/Modified

**New API Routes:**
- `app/api/orders/history/route.ts`
- `app/api/orders/[id]/delete/route.ts`
- `app/api/stats/revenue/route.ts`
- `app/api/stats/products/route.ts`
- `app/api/stats/tables/route.ts`

**New Pages:**
- `app/[locale]/admin/orders/page.tsx`

**Modified:**
- `components/AdminNav.tsx` - added Orders link

