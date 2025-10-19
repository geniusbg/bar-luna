# Mobile Optimization Guide

## Mobile-First Approach

Приложението е оптимизирано за mobile устройства с responsive дизайн.

## Responsive Breakpoints

```css
/* Tailwind breakpoints */
sm:   640px   /* Small tablets */
md:   768px   /* Tablets */
lg:   1024px  /* Laptops */
xl:   1280px  /* Desktops */
```

## Оптимизирани страници

### 1. Order Page (`/[locale]/order`)
- ✅ Header banner без горна навигация
- ✅ Language switcher в banner-а
- ✅ Sticky category filter само horizontal scroll
- ✅ Responsive product cards
- ✅ Mobile-optimized cart modal
- ✅ Fixed "Call Waiter" button

**Mobile特особености:**
- Category бутони - само horizontal scroll, без vertical
- Product names - truncate ако са твърде дълги
- Cart modal - пълна ширина отдолу
- Всички бутони - по-малък padding

### 2. Staff Dashboard (`/[locale]/staff`)
- ✅ Responsive header с flex-col на mobile
- ✅ PWA/Push бутони - full width на mobile
- ✅ Tab бутони - компактни с кратки labels
- ✅ Order/Call карти - оптимизиран padding
- ✅ Status бутони - по-малки на mobile
- ✅ Notification popups - responsive размери

**Mobile особености:**
- Tab labels - скрити текстове, само цифри: "(3)" вместо "Активни (3)"
- Notification popups - по-малък padding, по-малки текстове
- Карти - grid 1 колона на mobile

### 3. Admin QR Page (`/[locale]/admin/qr`)
- ✅ Header - вертикален layout
- ✅ Бутони - full width на mobile, кратки текстове
- ✅ QR карти - 1 колона mobile, 2 tablet, 3 desktop
- ✅ QR изображения - по-малки на mobile (192x192px)

### 4. Menu Page (`/[locale]/menu`)
- ✅ Category tabs - sticky, horizontal scroll
- ✅ Product cards - responsive grid
- ✅ Images - object-contain с черен фон

### 5. Navigation
- ✅ Hamburger menu на mobile
- ✅ Language switcher with Suspense
- ✅ Адаптивен logo размер

---

## Common Patterns

### Responsive Text Sizes
```jsx
<h1 className="text-2xl md:text-4xl">Title</h1>
<p className="text-sm md:text-base">Description</p>
```

### Responsive Padding
```jsx
<div className="p-4 md:p-6">Content</div>
<button className="px-3 md:px-6 py-2 md:py-3">Button</button>
```

### Responsive Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
```

### Responsive Flex Direction
```jsx
<div className="flex flex-col sm:flex-row gap-2 md:gap-4">
```

### Full Width on Mobile
```jsx
<button className="w-full sm:w-auto">Button</button>
```

### Hide on Mobile/Desktop
```jsx
<span className="hidden sm:inline">Desktop only</span>
<span className="sm:hidden">Mobile only</span>
```

---

## Touch Gestures

### Horizontal Scroll Only
```jsx
<div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
  <div className="flex gap-3 min-w-max">
    {/* Content */}
  </div>
</div>
```

### No Vertical Scroll
```jsx
style={{ overscrollBehaviorY: 'none', touchAction: 'pan-x' }}
```

---

## Testing Checklist

- [ ] Всички текстове се виждат (не са отрязани)
- [ ] Бутоните са достатъчно големи за tap (min 44x44px)
- [ ] Няма horizontal scroll на цялата страница
- [ ] Category filters - само horizontal scroll
- [ ] Navigation работи на mobile (hamburger menu)
- [ ] Language switcher работи и запазва query params
- [ ] Forms са удобни за попълване на mobile
- [ ] Modals/Popups не излизат извън екрана
- [ ] Sticky елементи не се припокриват

---

## Known Issues

### Category Filter Slight Vertical Movement
- **Проблем:** Много лек vertical scroll при horizontal scroll-ване на категориите
- **Причина:** Browser default behavior на `overflow-x` containers
- **Статус:** Минимален, едва забележим, не влияе на UX
- **Опити за fix:** `overflow-y-hidden`, `touch-action`, `overscroll-behavior` - частично подобрение

