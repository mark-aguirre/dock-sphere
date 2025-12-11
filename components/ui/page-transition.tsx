import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { pageTransitions } from "@/lib/animations"

interface PageTransitionProps {
  children: React.ReactNode
  variant?: keyof typeof pageTransitions
  className?: string
}

export function PageTransition({ 
  children, 
  variant = "default",
  className 
}: PageTransitionProps) {
  const pathname = usePathname()
  const transition = pageTransitions[variant]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={transition.transition as any}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Staggered children animation
interface StaggeredListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggeredList({ 
  children, 
  staggerDelay = 0.1,
  className 
}: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Fade in when in view
interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeInView({ 
  children, 
  delay = 0,
  className 
}: FadeInViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale on hover
interface ScaleOnHoverProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export function ScaleOnHover({ 
  children, 
  scale = 1.05,
  className 
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide in from direction
interface SlideInProps {
  children: React.ReactNode
  direction?: "left" | "right" | "up" | "down"
  distance?: number
  delay?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction = "up",
  distance = 50,
  delay = 0,
  className 
}: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left": return { x: -distance, y: 0 }
      case "right": return { x: distance, y: 0 }
      case "up": return { x: 0, y: distance }
      case "down": return { x: 0, y: -distance }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}