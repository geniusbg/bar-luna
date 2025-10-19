# Dual Currency Implementation

**Date:** 2025-10-16  
**Status:** Implemented ✅  
**Decision Makers:** Client requirement

---

## Context

Bulgaria is adopting the Euro in 2026. During the transition period (until end of 2025), all prices must be displayed in both BGN and EUR simultaneously.

**Fixed Exchange Rate:** €1 = 1.95583 BGN

---

## Decision

Implement **simultaneous dual currency display** instead of currency switcher.

### **Chosen Approach:**
Display both currencies together: `15.50 лв. / €7.93`

### **Rejected Approach:**
Currency switcher with toggle between BGN and EUR

---

## Rationale

**Pros:**
- ✅ Legal compliance (Bulgarian requirement)
- ✅ Better customer experience (see both prices at once)
- ✅ No confusion from switching
- ✅ Simpler implementation (no state management)
- ✅ Works for both locals and tourists

**Cons:**
- Takes more space
- Slightly more cluttered UI

---

## Implementation

**Component:** `components/Price.tsx`
```typescript
export default function Price({ priceBgn, inline = true }) {
  const bgnPrice = displayPrice(priceBgn, 'BGN');
  const eurPrice = displayPrice(priceBgn, 'EUR');
  
  if (inline) {
    return <span>
      <span className="font-semibold">{bgnPrice}</span>
      <span className="opacity-70 mx-2">/</span>
      <span className="opacity-90">{eurPrice}</span>
    </span>;
  }
  // ... stacked layout
}
```

**Usage:**
- Menu pages - inline display
- Cart totals - inline display
- Admin lists - stacked display (saves space)
- Staff dashboard - both currencies shown

**Removed:**
- `CurrencySwitcher` component (no longer needed)
- Currency state management
- LocalStorage currency preference

---

## Consequences

**Positive:**
- Legal compliance ensured
- Better UX for price comparison
- Reduced code complexity

**Neutral:**
- After 2026, can easily switch to EUR-only by changing `showBoth` default

**Negative:**
- Slightly more visual clutter
- Takes more horizontal space

---

## Notes

Client explicitly requested: "Цените трябва да се виждат и двете. поне до края на годината такова е изискването и в лева и евро"

This is a **legal requirement** in Bulgaria during Euro adoption transition period.

