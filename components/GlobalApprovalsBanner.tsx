'use client';

import { usePathname, useRouter } from 'next/navigation';
import PendingApprovalsBanner from './PendingApprovalsBanner';

interface GlobalApprovalsBannerProps {
  locale?: string;
}

export default function GlobalApprovalsBanner({ 
  locale = 'bg'
}: GlobalApprovalsBannerProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Only show in admin and staff sections
  if (!pathname?.includes('/admin') && !pathname?.includes('/staff')) {
    return null;
  }

  // Don't show on login pages
  if (pathname?.includes('/login')) {
    return null;
  }

  const handleApprovalClick = (approval: any) => {
    // Navigate to approvals tab
    if (pathname?.includes('/admin/orders')) {
      router.push(`/${locale}/admin/orders?tab=approvals&approval=${approval.orderId}`);
    } else if (pathname?.includes('/admin')) {
      router.push(`/${locale}/admin/orders?tab=approvals&approval=${approval.orderId}`);
    } else if (pathname?.includes('/staff')) {
      // For staff, we can't navigate to admin page, so just show modal would need to be handled in staff page
      // For now, just navigate to admin orders (staff can also approve)
      router.push(`/${locale}/admin/orders?tab=approvals&approval=${approval.orderId}`);
    }
  };

  return (
    <PendingApprovalsBanner 
      locale={locale} 
      onApprovalClick={handleApprovalClick}
      showButtons={true}
    />
  );
}

