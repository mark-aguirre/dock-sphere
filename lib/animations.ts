// Animation utilities and presets for consistent animations across the app

export const animations = {
  // Fade animations
  fadeIn: "animate-in fade-in duration-300",
  fadeOut: "animate-out fade-out duration-200",
  
  // Slide animations
  slideInFromTop: "animate-in slide-in-from-top-4 duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom-4 duration-300",
  slideInFromLeft: "animate-in slide-in-from-left-4 duration-300",
  slideInFromRight: "animate-in slide-in-from-right-4 duration-300",
  
  // Scale animations
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-150",
  
  // Combined animations
  fadeSlideIn: "animate-in fade-in slide-in-from-bottom-4 duration-300",
  fadeScaleIn: "animate-in fade-in zoom-in-95 duration-200",
  
  // Stagger delays for list items
  stagger: {
    1: "animation-delay-[0ms]",
    2: "animation-delay-[100ms]", 
    3: "animation-delay-[200ms]",
    4: "animation-delay-[300ms]",
    5: "animation-delay-[400ms]",
    6: "animation-delay-[500ms]"
  }
}

// CSS custom properties for dynamic animations
export const animationVariables = {
  "--animation-duration": "300ms",
  "--animation-delay": "0ms",
  "--animation-easing": "cubic-bezier(0.4, 0, 0.2, 1)"
} as React.CSSProperties

// Hover effects
export const hoverEffects = {
  lift: "transition-transform hover:scale-105 hover:-translate-y-1",
  glow: "transition-shadow hover:shadow-lg hover:shadow-primary/25",
  subtle: "transition-colors hover:bg-accent/50",
  card: "transition-all hover:shadow-md hover:-translate-y-0.5",
  button: "transition-all hover:scale-105 active:scale-95"
}

// Loading animations
export const loadingAnimations = {
  spin: "animate-spin",
  pulse: "animate-pulse", 
  bounce: "animate-bounce",
  ping: "animate-ping"
}

// Page transition variants
export const pageTransitions = {
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  
  slide: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
}

// Utility functions
export function getStaggerDelay(index: number, baseDelay = 100): string {
  return `${index * baseDelay}ms`
}

export function createStaggeredAnimation(
  totalItems: number, 
  baseDelay = 100,
  animation = animations.fadeSlideIn
): string[] {
  return Array.from({ length: totalItems }, (_, i) => 
    `${animation} animation-delay-[${getStaggerDelay(i, baseDelay)}]`
  )
}

// Animation presets for common components
export const componentAnimations = {
  card: `${animations.fadeSlideIn} ${hoverEffects.card}`,
  button: `${hoverEffects.button}`,
  modal: animations.fadeScaleIn,
  toast: animations.slideInFromRight,
  dropdown: animations.fadeSlideIn,
  sidebar: animations.slideInFromLeft,
  
  // List animations with stagger
  listItem: (index: number) => 
    `${animations.fadeSlideIn} ${animations.stagger[Math.min(index + 1, 6) as keyof typeof animations.stagger]}`,
    
  // Status-based animations
  success: "animate-in zoom-in-95 duration-200 text-green-600",
  error: "animate-in shake duration-300 text-destructive",
  warning: "animate-in fade-in duration-200 text-yellow-600"
}

// Micro-interaction animations
export const microAnimations = {
  // Button states
  buttonPress: "active:scale-95 transition-transform duration-75",
  buttonHover: "hover:scale-105 transition-transform duration-150",
  
  // Icon animations
  iconSpin: "hover:rotate-180 transition-transform duration-300",
  iconBounce: "hover:animate-bounce",
  iconPulse: "hover:animate-pulse",
  
  // Input focus
  inputFocus: "focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200",
  
  // Loading states
  shimmer: "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]"
}