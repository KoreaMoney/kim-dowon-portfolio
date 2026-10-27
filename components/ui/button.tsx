import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-sm font-semibold transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63CE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3F7FA] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "border-[#0B63CE] bg-[#0B63CE] !text-white hover:bg-[#084FA7] hover:-translate-y-0.5",
        secondary: "border-[#9BAFC1] bg-white text-[#111827] hover:bg-[#E6F0FC] hover:-translate-y-0.5",
        ghost: "border-transparent bg-transparent text-[#40546A] hover:bg-[#E6F0FC] hover:text-[#111827]",
      },
      size: {
        default: "min-h-11 px-3 py-2",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
