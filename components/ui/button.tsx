import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:bg-muted/60",
        ghost: 
          "text-foreground hover:bg-muted/90 hover:text-foreground active:bg-muted/95",
        link: 
          "text-primary hover:text-primary/80 underline-offset-4 hover:underline active:text-primary/70",
        success:
          "bg-status-running text-white hover:bg-status-running/90 active:bg-status-running/95",
        warning:
          "bg-status-warning text-white hover:bg-status-warning/90 active:bg-status-warning/95",
      },
      size: {
        default: "h-8 px-3 py-1.5 rounded-md",
        sm: "h-7 px-2.5 text-sm rounded-md",
        lg: "h-9 px-6 text-base rounded-md",
        icon: "h-8 w-8 rounded-md",
        xs: "h-6 px-1.5 text-xs rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
