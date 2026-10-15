import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function HRMSDialog({ open, onOpenChange, title, description, children, wide = false }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#071a2f]/35 backdrop-blur-[3px]" />
        <Dialog.Content className={`fixed left-1/2 top-1/2 z-[81] max-h-[92vh] w-[calc(100%-24px)] ${wide ? 'max-w-[1280px]' : 'max-w-[640px]'} -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_28px_80px_#0a345044] focus:outline-none sm:p-6`}>
          <div className="mb-5 pr-10">
            <Dialog.Title className="text-xl font-bold tracking-[-0.03em] text-[#0d2344]">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 text-xs leading-5 text-[#6c8096]">{description}</Dialog.Description>
          </div>
          <Dialog.Close className="absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-xl border border-[#dce7f0] bg-[#f8fbfd] text-[#365a78]" aria-label="Close dialog"><X size={17} /></Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
