# Technical Overview - Luna Bar

## Recommended Technology Stack

### Frontend
**Next.js 14+ (React)**
- Server-side rendering for SEO
- Built-in i18n support for multi-language
- Modern, performant framework
- Easy deployment

**Styling:**
- Tailwind CSS - modern, responsive design
- Shadcn/ui - beautiful component library

### Backend & Database
**Option 1: Supabase (Recommended)**
- PostgreSQL database
- Built-in authentication
- Real-time capabilities
- Row Level Security (RLS)
- Storage for images
- REST & GraphQL APIs
- **POS Integration Ready:** REST API can integrate with most modern POS systems

**Option 2: Firebase**
- Firestore database
- Authentication
- Storage
- Cloud Functions
- Real-time updates

### Admin Panel
**React Admin** or **Refine.dev**
- Built on React
- Automatic CRUD operations
- File upload support
- Customizable

### Multi-Language (i18n)
**next-intl** or **next-i18next**
- Seamless language switching
- SEO-friendly translations
- Route-based language detection

### Image Management
**Cloudinary** or **Supabase Storage**
- CDN delivery
- Automatic optimization
- Transformations

## Best Practices for Bar/Restaurant Websites

### Menu Structure
```
Categories (Top Level)
├── Alcohol
│   ├── Beer
│   ├── Wine
│   ├── Spirits
│   └── Cocktails
├── Coffee
│   ├── Hot Coffee
│   └── Cold Coffee
├── Non-Alcoholic
└── Food (if applicable)
```

### Product Data Model
```typescript
Product {
  id: string
  name: { bg: string, en: string, de: string }
  description: { bg: string, en: string, de: string }
  price_bgn: number
  price_eur: number (auto-calculated)
  category_id: string
  image_url: string
  available: boolean
  allergens?: string[]
  is_featured: boolean
}
```

### Event Management
```typescript
Event {
  id: string
  title: { bg: string, en: string, de: string }
  description: { bg: string, en: string, de: string }
  date: datetime
  location: string (Luna or external)
  is_external: boolean
  image_url: string
  published: boolean
}
```

## POS Integration Considerations

### API Requirements
- **RESTful API** for product sync
- **Webhooks** for real-time updates
- **JWT Authentication** for secure access
- **Rate limiting** for stability

### Common POS Integration Points
- Product catalog sync
- Inventory management
- Price updates
- Sales data (future)

### Recommended Architecture
```
Luna Website (Next.js)
    ↓
Supabase (Database + API)
    ↓
Middleware/Integration Layer
    ↓
POS System (Future)
```

## Security Best Practices
- HTTPS only
- Secure admin authentication (2FA recommended)
- Image upload validation
- SQL injection protection (using ORMs)
- XSS protection
- CORS configuration for API

## Performance Optimization
- Image lazy loading
- CDN for static assets
- Database indexing
- Caching strategies
- Mobile-first responsive design

## Deployment Options
- **Vercel** (Next.js optimized)
- **Netlify**
- **DigitalOcean App Platform**
- **AWS Amplify**


