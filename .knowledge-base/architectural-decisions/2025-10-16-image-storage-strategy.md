# Image Storage Strategy

**Date:** 2025-10-16  
**Status:** Implemented ✅  
**Approach:** Local file storage

---

## Context

Product and event images need to be:
- Uploaded by admin
- Displayed on menu pages
- Served efficiently
- Managed easily

Expected volume: ~100-200 images total

---

## Decision

Use **local file storage** in `/public/uploads/` directory.

### **Alternatives Considered:**

**1. Local Storage** ✅ (Chosen)
- Files in `/public/uploads/`
- Served as static assets
- No external costs
- Simple implementation

**2. Cloudinary**
- Cloud-based CDN
- Image optimization
- Transformations
- 💰 Cost: Free tier limited
- Dependency on external service

**3. Supabase Storage**
- Integrated with Supabase
- CDN included
- 💰 Cost: Limited free tier
- Requires Supabase subscription

**4. AWS S3**
- Industry standard
- High reliability
- 💰 Cost: Pay per GB
- Complex setup

---

## Implementation

### **Upload Flow**

**1. Frontend** (`components/ImageUpload.tsx`):
```typescript
const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'product-images');
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { url } = await response.json();
  // url = "/uploads/1760562869241-m573kv.JPG"
  onImageUploaded(url);
};
```

**2. Backend** (`app/api/upload/route.ts`):
```typescript
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validate type (jpeg, jpg, png, webp)
  // Validate size (max 5MB)
  
  const fileName = `${Date.now()}-${Math.random().toString(36)}.${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const filePath = join(uploadDir, fileName);
  
  await writeFile(filePath, buffer);
  
  return NextResponse.json({ url: `/uploads/${fileName}` });
}
```

**3. Storage:**
```
public/
  uploads/
    1760562869241-m573kv.JPG
    1760563350056-59cthr.JPG
    ...
```

**4. Access:**
- URL: `/uploads/filename.jpg`
- No authentication required
- Served as static file by Next.js

---

## Critical Fix: Locale Prefix Issue

### **Problem:**
Next.js i18n middleware was adding locale prefix to image URLs:
- `/uploads/image.jpg` → `/bg/uploads/image.jpg` (404 Not Found)

### **Solutions Applied:**

**1. Middleware Configuration:**
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|order).*)',
    //                                              ^^^^^^^ EXCLUDE
  ]
};
```

**2. Use Native `<img>` Tags:**
- Replaced Next.js `Image` component with native `<img>`
- Next.js Image adds routing logic that interferes with static files
- Native `<img>` has direct path access

```typescript
// ❌ Before (adds locale prefix)
<Image src="/uploads/image.jpg" ... />

// ✅ After (direct access)
<img src="/uploads/image.jpg" ... />
```

**3. Next.js Config:**
```typescript
// next.config.ts
images: {
  unoptimized: true, // Allow native img tags
}
```

---

## Validation

**File Types:**
- image/jpeg, image/jpg, image/png, image/webp
- Rejected: gif, svg, bmp (security)

**File Size:**
- Maximum: 5MB
- Recommended: 800x600px for products

**Naming:**
- Pattern: `{timestamp}-{random}.{ext}`
- Prevents collisions
- Sortable by date

---

## Consequences

**Positive:**
- ✅ No external dependencies
- ✅ No recurring costs
- ✅ Fast local access
- ✅ Simple backup (copy directory)
- ✅ No API rate limits
- ✅ Full control over files

**Negative:**
- ❌ No CDN (slower for remote users)
- ❌ No automatic optimization
- ❌ Manual backups required
- ❌ Server storage used

**Mitigation:**
- Small image count (~100-200) = negligible storage
- Can add CDN later if needed (Cloudflare)
- Can migrate to cloud storage if scaling required

---

## Security Considerations

**Implemented:**
- File type validation (whitelist)
- File size limits (5MB)
- Unique filenames (prevents overwrite)
- No executable uploads

**Missing (acceptable for current use):**
- No virus scanning
- No user upload rate limiting
- No image content validation

---

## Backup Strategy

**Recommended:**
1. Regular backup of `/public/uploads/` directory
2. Include in database backup workflow
3. Store off-site (cloud backup service)

**Restore:**
Simply copy `/public/uploads/` directory back

---

## Future Improvements

**If scaling needed:**
- [ ] Migrate to Cloudinary/S3
- [ ] Add image optimization (WebP conversion)
- [ ] Add CDN (Cloudflare)
- [ ] Implement lazy loading
- [ ] Add progressive image loading

**Current assessment:** Local storage sufficient for bar use case.

