import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Sheet({ open, onOpenChange, top = 0, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-x-0 bottom-0 z-40 bg-[#09294566] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out"
          style={{ top }}
        />
        <Dialog.Content
          className="fixed bottom-0 left-0 z-50 w-[min(88vw,320px)] overflow-hidden rounded-r-[22px] bg-white shadow-[18px_0_55px_#003b6230] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out"
          style={{ top }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Close className="absolute right-3 top-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full border border-[#e2ebf4] bg-white text-[#315375] shadow-sm" aria-label="Close HRMS navigation">
            <X size={18} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
