# Luna Bar - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free tier is sufficient)
- [ ] Supabase account (free tier is sufficient)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** Luna Bar
   - **Database Password:** (create strong password - save it!)
   - **Region:** Europe Central (Germany) - closest to Bulgaria
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 1.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open file `supabase/schema.sql` from the project
4. Copy all content and paste into SQL Editor
5. Click "Run" or press Ctrl+Enter
6. Verify success - should see "Success. No rows returned"
7. Go to **Table Editor** - you should see:
   - categories (8 rows)
   - products (0 rows)
   - events (0 rows)

### 1.3 Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Click "Create bucket"
3. Name: `product-images`
4. Set to **Public**
5. Click "Create bucket"
6. Repeat for: `event-images`

### 1.4 Configure Storage Policies

1. Click on `product-images` bucket
2. Go to **Policies** tab
3. Click "New Policy"
4. Create policy for public read:
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'product-images');
   ```
5. Create policy for authenticated uploads:
   ```sql
   CREATE POLICY "Authenticated uploads"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
   ```
6. Repeat for `event-images`

### 1.5 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy and save:
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon/public key** (starts with "eyJ...")
   - **service_role key** (KEEP SECRET!)

## Step 2: GitHub Repository

### 2.1 Initialize Git (if not done)

```bash
cd luna
git init
git add .
git commit -m "Initial commit - Luna Bar website"
```

### 2.2 Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `luna-bar-website`
3. Set to **Private**
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/luna-bar-website.git
git branch -M main
git push -u origin main
```

## Step 3: Vercel Deployment

### 3.1 Import Project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository `luna-bar-website`
4. Click "Import"

### 3.2 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Root Directory:** `./` (leave default)

### 3.3 Add Environment Variables

In "Environment Variables" section, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

⚠️ **Important:** 
- Replace values with your actual Supabase credentials
- `NEXT_PUBLIC_APP_URL` will be your Vercel URL (update after first deploy)

### 3.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Your site will be live at: `https://luna-bar-xxxxx.vercel.app`

### 3.5 Update APP_URL

1. Copy your Vercel URL
2. In Vercel dashboard → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_APP_URL` to your Vercel URL
4. Click "Save"
5. Redeploy (Deployments → Latest → "Redeploy")

## Step 4: Custom Domain (Optional)

### 4.1 Get Domain

Buy domain from:
- [Namecheap](https://www.namecheap.com) - `lunabar.bg`
- [Cloudflare](https://www.cloudflare.com/products/registrar/)
- [GoDaddy](https://www.godaddy.com)

### 4.2 Configure DNS

1. In Vercel dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `lunabar.bg`
4. Vercel will provide DNS records
5. Add records to your domain provider:

**For apex domain (lunabar.bg):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

6. Wait 24-48 hours for DNS propagation
7. SSL certificate will be auto-generated

## Step 5: Admin Setup

### 5.1 Create Admin User

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click "Invite user"
3. Enter admin email
4. User receives confirmation email

### 5.2 Add Admin Role

In Supabase **SQL Editor**, run:

```sql
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@lunabar.bg';
```

Replace `admin@lunabar.bg` with actual admin email.

## Step 6: Initial Content

### 6.1 Add Products

1. Go to `https://your-domain.com/bg/admin/products`
2. Click "Добави продукт"
3. Fill in Bulgarian, English, and German names
4. Set price in BGN (EUR auto-calculated)
5. Upload image (optional)
6. Click "Запази"

### 6.2 Add Events

1. Go to `https://your-domain.com/bg/admin/events`
2. Click "Добави събитие"
3. Fill in details for all languages
4. Set date and location
5. Check "Публикувано" to make visible
6. Click "Запази"

## Step 7: Testing

### 7.1 Public Site

Test these URLs:
- `https://your-domain.com/bg` - Bulgarian homepage
- `https://your-domain.com/en` - English
- `https://your-domain.com/de` - German
- `https://your-domain.com/bg/menu` - Menu
- `https://your-domain.com/bg/events` - Events

### 7.2 Admin Panel

- `https://your-domain.com/bg/admin` - Dashboard
- Add/edit products
- Add/edit events
- Test image upload

### 7.3 Currency Toggle

- Click BGN/EUR toggle
- Verify prices update
- Check localStorage persistence

### 7.4 Language Switch

- Click BG/EN/DE buttons
- Verify content changes
- Check URL updates

## Step 8: Monitoring

### 8.1 Vercel Analytics

1. In Vercel dashboard → Analytics
2. Enable Web Analytics (free)
3. View visitor stats

### 8.2 Supabase Logs

1. In Supabase dashboard → Logs
2. Monitor API requests
3. Check for errors

## 🔧 Troubleshooting

### Build Fails

**Error:** "Module not found"
- Run `npm install` locally
- Check package.json
- Ensure all imports are correct

**Error:** "Environment variable missing"
- Verify all env vars in Vercel
- Check spelling/capitalization
- Redeploy after adding vars

### Database Issues

**Tables not created:**
- Re-run schema.sql
- Check SQL Editor for errors
- Verify RLS is enabled

**Can't upload images:**
- Check storage buckets exist
- Verify policies are created
- Check service role key is set

### Language/Currency Not Working

**Language not switching:**
- Clear browser cache
- Check middleware.ts
- Verify locale in URL

**Currency not updating:**
- Check localStorage
- Verify CurrencySwitcher component
- Test in incognito mode

## 📊 Performance Optimization

### After Deployment

1. **Image Optimization**
   - Use WebP format
   - Compress images before upload
   - Recommended: 800x600px, <500KB

2. **Caching**
   - Vercel auto-configures
   - Static pages cached at edge
   - API routes cached when possible

3. **Database**
   - Indexes already created in schema
   - Monitor slow queries in Supabase

## 🔒 Security Checklist

- [ ] Environment variables set correctly
- [ ] Service role key kept secret (not in frontend)
- [ ] RLS enabled on all tables
- [ ] Storage policies configured
- [ ] Admin authentication working
- [ ] HTTPS enabled (auto with Vercel)
- [ ] Regular backups enabled (Supabase auto)

## 📱 Mobile Testing

Test on:
- iOS Safari
- Android Chrome
- Tablet devices

Verify:
- Responsive layout
- Touch interactions
- Image loading
- Form inputs

## 🎉 Go Live Checklist

- [ ] Domain configured and working
- [ ] SSL certificate active (https://)
- [ ] All pages loading correctly
- [ ] Admin panel accessible
- [ ] Products added
- [ ] Events added
- [ ] Images uploading
- [ ] All 3 languages working
- [ ] Currency toggle working
- [ ] Contact info correct
- [ ] Social media links working
- [ ] Google Maps embedded
- [ ] Mobile responsive
- [ ] Performance good (test with Lighthouse)

## 📞 Post-Launch

### Share Website
- Update Facebook page with new URL
- Update Instagram bio
- Add to Google My Business
- Share on social media

### Monitor
- Check Vercel analytics daily
- Review Supabase usage
- Monitor errors in logs
- Collect user feedback

### Regular Maintenance
- Update menu weekly
- Add events as scheduled
- Update prices as needed
- Backup database monthly

---

## Need Help?

**Vercel Issues:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

**Supabase Issues:**
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

**Development Issues:**
- Check README.md
- Review API_DOCUMENTATION.md
- Inspect browser console for errors

---

🎉 **Congratulations! Luna Bar website is live!** 🌙


