import { useEffect } from 'react';

/**
 * Hook to lock/unlock body scroll when a modal or full-screen component is open
 * @param isLocked - Whether to lock the scroll
 */
export function useLockScroll(isLocked: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isLocked) {
      // Store original values
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const scrollY = window.scrollY;
      
      // Force scroll to top first - multiple methods to ensure it works
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (window.scrollTo) window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      
      // Lock scroll using position fixed (most reliable method)
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
      
      // Prevent scrolling, but allow scrolling inside modals
      const preventScroll = (e: Event) => {
        const target = e.target;
        
        // Check if target is a valid Element
        if (!target || !(target instanceof Element)) {
          e.preventDefault();
          return false;
        }
        
        // Check if the event is coming from an element that can scroll
        // (has overflow-y: auto or overflow-y: scroll)
        let element: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
        while (element && element !== document.body && element !== document.documentElement) {
          try {
            const style = window.getComputedStyle(element);
            const overflowY = style.overflowY;
            const overflow = style.overflow;
            
            // If element has scrollable overflow, allow the scroll
            if (overflowY === 'auto' || overflowY === 'scroll' || 
                overflow === 'auto' || overflow === 'scroll') {
              // Check if element can actually scroll
              const canScroll = element.scrollHeight > element.clientHeight;
              if (canScroll) {
                return true; // Allow scrolling in this element
              }
            }
          } catch (error) {
            // If getComputedStyle fails, continue to parent
            console.warn('Error getting computed style:', error);
          }
          
          element = element.parentElement;
        }
        
        // If we reach here, the scroll is on the body, prevent it
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Add event listeners to prevent scrolling
      window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
      window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
      
      return () => {
        // Remove event listeners
        window.removeEventListener('scroll', preventScroll, { capture: true } as any);
        window.removeEventListener('wheel', preventScroll, { capture: true } as any);
        window.removeEventListener('touchmove', preventScroll, { capture: true } as any);
        
        // Restore original values
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.left = '';
        document.body.style.right = '';
        
        // Restore scroll position only if it was saved
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      };
    }
  }, [isLocked]);
}

