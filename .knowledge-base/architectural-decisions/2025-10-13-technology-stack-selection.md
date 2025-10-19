# Technology Stack Selection

**Date:** 2025-10-13  
**Status:** Proposed

## Context

Luna Bar requires a modern website with:
- Multi-language support (BG, EN, DE)
- Dual currency pricing (BGN/EUR)
- Admin panel for menu/event management
- Future POS system integration capability

## Decision

**Recommended Stack:**

### Frontend: Next.js 14+ with TypeScript
**Rationale:**
- Built-in i18n support for multi-language
- Server-side rendering for SEO
- Modern, performant React framework
- Easy deployment on Vercel/Netlify
- Strong TypeScript support for type safety

### Backend: Supabase (PostgreSQL)
**Rationale:**
- PostgreSQL is industry standard for restaurants/bars
- Built-in REST API for POS integration
- Real-time capabilities
- Built-in authentication & authorization
- Integrated storage for images
- Row Level Security (RLS) for data protection

**Alternative Considered:** Firebase
- Pros: Easy setup, real-time
- Cons: NoSQL less suitable for structured menu data, harder POS integration

### Admin Panel: React Admin or Refine.dev
**Rationale:**
- Built on React (same as frontend)
- Auto-generated CRUD operations
- File upload support
- Highly customizable

### i18n: next-intl
**Rationale:**
- SEO-friendly
- Type-safe translations
- Route-based language detection
- Lightweight

### Styling: Tailwind CSS + Shadcn/ui
**Rationale:**
- Modern, responsive design
- Beautiful pre-built components
- Highly customizable
- Performance optimized

## Consequences

### Positive
- ✅ Scalable architecture
- ✅ Easy POS integration via REST API
- ✅ Fast development with modern tools
- ✅ Excellent performance & SEO
- ✅ Cost-effective (Vercel free tier, Supabase free tier)

### Negative
- ⚠️ Team needs familiarity with Next.js & Supabase
- ⚠️ Initial setup time for proper i18n configuration

### Risks
- Database migration if scaling beyond Supabase limits (unlikely for single bar)
- POS integration depends on specific POS system APIs (mitigated by using standard REST)

## Implementation Notes

1. Start with Next.js project setup
2. Configure Supabase database with proper schema
3. Implement i18n with next-intl
4. Build admin panel with React Admin
5. Create public-facing menu pages
6. Add event management
7. Future: API endpoints for POS integration


