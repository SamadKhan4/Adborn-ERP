import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0987c426] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-[#0987C4] via-[#006EB5] to-[#003B62] px-4 py-3 text-white shadow-[inset_0_1px_0_#ffffff55,0_3px_0_#004f84,0_8px_18px_#006eb522] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_#ffffff66,0_3px_0_#004f84,0_11px_22px_#006eb52b] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_#003b6233,0_1px_0_#004f84,0_4px_9px_#006eb51f]',
        secondary:
          'border border-[#dfe8f2] bg-white px-4 py-3 text-[#214263] shadow-[inset_0_1px_0_white,0_2px_0_#dbe6f0,0_6px_14px_#315d8610] hover:-translate-y-0.5 hover:bg-[#f7fbff] active:translate-y-0.5',
        ghost:
          'px-3 py-2 text-[#526b86] hover:bg-[#eaf5fc] hover:text-[#006EB5]',
      },
      size: {
        default: 'min-h-10',
        icon: 'size-10 p-0',
        sm: 'min-h-8 px-3 py-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
