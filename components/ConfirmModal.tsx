 'use client';
 
 type ConfirmModalProps = {
   open: boolean;
   title?: string;
   message: string;
   confirmLabel?: string;
   cancelLabel?: string;
   tone?: 'danger' | 'default';
   onConfirm: () => void | Promise<void>;
   onCancel: () => void;
 };
 
 export default function ConfirmModal({
   open,
   title = 'Потвърждение',
   message,
   confirmLabel = 'Потвърди',
   cancelLabel = 'Отказ',
   tone = 'default',
   onConfirm,
   onCancel,
 }: ConfirmModalProps) {
   if (!open) return null;
 
   const confirmClass = tone === 'danger' ? 'malts-btn-danger' : 'malts-btn-primary';
 
   return (
     <div
       className="fixed inset-0 bg-[var(--malts-paper)]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
       role="dialog"
       aria-modal="true"
       aria-label={title}
     >
       <div className="malts-card rounded-2xl w-full max-w-md p-6">
         <div className="flex items-start justify-between gap-4 mb-3">
           <h3 className="text-xl font-bold text-[var(--malts-ink)]">{title}</h3>
           <button
             type="button"
             onClick={onCancel}
             className="text-[var(--malts-subtle)] hover:text-[var(--malts-ink)] transition-colors text-2xl leading-none"
             aria-label="Затвори"
           >
             ×
           </button>
         </div>
 
         <p className="malts-muted mb-6 whitespace-pre-line">{message}</p>
 
         <div className="flex gap-3">
           <button type="button" onClick={onCancel} className="flex-1 malts-btn-secondary rounded-lg font-semibold">
             {cancelLabel}
           </button>
           <button type="button" onClick={onConfirm} className={`flex-1 ${confirmClass} rounded-lg font-semibold`}>
             {confirmLabel}
           </button>
         </div>
       </div>
     </div>
   );
 }
 
