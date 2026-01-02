# Getting Started with Luna Bar Website

## 🎯 Бърз старт (за разработчици)

### 1. Инсталация

```bash
# Клониране на проекта
git clone <repository-url>
cd luna

# Инсталиране на зависимости
npm install
```

### 2. Environment Setup

Създайте `.env.local` файл в root директорията:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Създайте Supabase проект на [https://supabase.com](https://supabase.com)
2. Отворете SQL Editor
3. Копирайте съдържанието на `supabase/schema.sql`
4. Изпълнете query-то
5. Проверете дали таблиците са създадени

**Детайлни инструкции:** Вижте `supabase/SETUP.md`

### 4. Стартиране на Dev Server

```bash
npm run dev
```

Отворете [http://localhost:3000](http://localhost:3000) в браузъра.

## 📁 Какво е създадено?

### Public Pages (БГ/EN/DE)
- ✅ **Homepage** - `http://localhost:3000/bg`
- ✅ **Menu** - `http://localhost:3000/bg/menu`
- ✅ **Events** - `http://localhost:3000/bg/events`
- ✅ **Contact** - `http://localhost:3000/bg/contact`

### Admin Panel
- ✅ **Dashboard** - `http://localhost:3000/bg/admin`
- ✅ **Products** - `http://localhost:3000/bg/admin/products`
- ✅ **Events** - `http://localhost:3000/bg/admin/events`

### API Endpoints
- ✅ `/api/products` - CRUD за продукти
- ✅ `/api/events` - CRUD за събития
- ✅ `/api/upload` - Upload на снимки
- ✅ `/api/pos/*` - POS интеграция endpoints

## 🔑 Key Features

### 1. Multi-Language
- Български (основен)
- English
- Deutsch (German)
- Превключвател в navigation

### 2. Dual Currency
- BGN (лева)
- EUR (евро)
- Фиксиран курс: 1 EUR = 1.95583 BGN
- Toggle в navigation

### 3. Admin Panel
- Product management с мултиезична поддръжка
- Event management (Luna + партньорски събития)
- Image upload директно към Supabase
- Автоматично EUR цени от BGN

### 4. Database Structure

**Categories:**
- Предефинирани 8 категории
- Multi-language names
- Custom ordering

**Products:**
- Multi-language (БГ/EN/DE)
- Dual pricing (BGN/EUR)
- Availability status
- Featured flag
- Image support
- Category assignment

**Events:**
- Multi-language
- Luna events / External events
- Image support
- Published/Draft status
- Date & location

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## 📚 Documentation Files

- **README.md** - Project overview and setup
- **DEPLOYMENT.md** - Step-by-step deployment guide
- **API_DOCUMENTATION.md** - REST API reference
- **supabase/SETUP.md** - Database setup guide
- **env.example** - Environment variables template

## 🎨 UI/UX

### Design System
- **Colors:** Purple/Slate gradient theme
- **Font:** Geist Sans & Geist Mono
- **Framework:** Tailwind CSS
- **Icons:** SVG & Lucide React
- **Responsive:** Mobile-first design

### Pages Layout
- Fixed navigation with language/currency toggles
- Hero sections with gradients
- Card-based layouts
- Glassmorphism effects
- Smooth transitions

## 🔧 Tech Stack

### Core
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Supabase** - PostgreSQL database
- **Supabase Storage** - Image hosting
- **Supabase Auth** - Authentication (ready)

### Libraries
- **next-intl** - Internationalization
- **@supabase/supabase-js** - Supabase client

## 🔄 Development Workflow

### Adding a Product

1. Go to `/bg/admin/products`
2. Click "Добави продукт"
3. Fill in:
   - Bulgarian, English, German names
   - Descriptions (optional)
   - Category
   - Price in BGN (EUR auto-calculated)
   - Image URL or upload
   - Availability & Featured status
4. Click "Запази"

### Adding an Event

1. Go to `/bg/admin/events`
2. Click "Добави събитие"
3. Fill in:
   - Titles (БГ/EN/DE)
   - Descriptions (БГ/EN/DE)
   - Date & time
   - Location
   - External event checkbox
   - Published checkbox
   - Image URL or upload
4. Click "Запази"

### Testing Multi-Language

1. Navigate to homepage
2. Click language buttons (БГ/EN/DE)
3. Verify URL changes to `/bg`, `/en`, `/de`
4. Check content updates
5. Test on all pages

### Testing Currency

1. Navigate to menu page
2. Click BGN/EUR toggle
3. Verify prices update
4. Refresh page - selection persists
5. Check localStorage in DevTools

## 🐛 Common Issues

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection fails
- Check `.env.local` has correct values
- Verify Supabase project is active
- Check API keys are valid

### Images not uploading
- Verify storage buckets exist in Supabase
- Check storage policies are created
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Build fails
```bash
# Check TypeScript errors
npm run build

# Fix any type errors shown
```

## 📱 Testing Checklist

### Public Site
- [ ] Homepage loads in all languages
- [ ] Menu displays products correctly
- [ ] Events show upcoming events
- [ ] Contact page has correct info
- [ ] Language switcher works
- [ ] Currency toggle works
- [ ] Images load properly
- [ ] Mobile responsive
- [ ] Navigation works

### Admin Panel
- [ ] Can access dashboard
- [ ] Can add product
- [ ] Can edit product
- [ ] Can delete product
- [ ] Can upload image
- [ ] Can add event
- [ ] EUR prices calculate correctly
- [ ] All languages save properly

### API
- [ ] GET /api/products returns data
- [ ] POST /api/products creates product
- [ ] GET /api/events returns events
- [ ] POST /api/upload uploads image
- [ ] GET /api/pos/products/sync works

## 🚀 Ready for Production?

Before deploying:

1. ✅ All tests passing
2. ✅ Environment variables configured
3. ✅ Database schema deployed
4. ✅ Storage buckets created
5. ✅ Initial content added
6. ✅ Admin authentication setup
7. ✅ Performance tested
8. ✅ Mobile tested

**Next step:** Follow `DEPLOYMENT.md` for deployment guide.

## 💡 Tips

### Performance
- Images should be <500KB
- Use WebP format when possible
- Optimize before upload

### Content
- Keep product names concise
- Descriptions optional but helpful
- Always provide all 3 languages

### SEO
- Product names are searchable
- Descriptions help with SEO
- Images should have descriptive names

## 📞 Need Help?

### Documentation
- 📖 README.md - Main documentation
- 🚀 DEPLOYMENT.md - Deployment guide
- 🔌 API_DOCUMENTATION.md - API reference
- 💾 supabase/SETUP.md - Database setup

### Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [next-intl Docs](https://next-intl-docs.vercel.app)

---

Happy coding! 🎉


