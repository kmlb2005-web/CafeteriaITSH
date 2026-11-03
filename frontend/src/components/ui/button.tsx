import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/40',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30 hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/40',
        outline:
          'border border-border bg-surface text-foreground hover:border-primary/50 hover:bg-muted',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/30 hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/40',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // Altura mínima de 44 px (DESIGN.md: botones 44-48 px, FR-020)
        default: 'h-11 px-4 py-2',
        sm: 'h-11 px-3 text-sm',
        lg: 'h-11 px-8',
        touch: 'h-11 min-h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
