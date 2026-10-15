import * as React from 'react'
import { cn } from '../../lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/80 bg-surface-container-lowest text-foreground shadow-[0_1px_2px_rgba(28,25,23,0.05),0_14px_30px_-20px_rgba(30,122,70,0.45)] transition-all duration-200',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-heading text-lg font-bold leading-none', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
