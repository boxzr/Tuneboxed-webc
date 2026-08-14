import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Motion tokens.
 *
 * Values are lifted from Vercel's site rather than picked by taste, because
 * the thing that makes their motion feel expensive is how little of it there
 * is: an 8px rise, a 0.3s fade, and hover states measured in low hundreds of
 * milliseconds. Bigger distances and longer durations read as slow and
 * decorative, which is what the site was doing before.
 */
export const MOTION = {
  /** Standard ease. Their --ease-in-out and the default for most transitions. */
  easeInOut: [0.4, 0, 0.2, 1] as const,
  /** Entrances decelerate only, so they never look like they start slowly. */
  easeOut: [0, 0, 0.2, 1] as const,
  /** Slight overshoot, used sparingly for things that pop in. */
  swift: [0.175, 0.885, 0.32, 1.1] as const,
  /** The whole reveal travel. Deliberately small. */
  rise: 8,
  duration: 0.3,
  /** Gap between staggered siblings. */
  stagger: 0.06,
};

interface RevealProps {
  children: ReactNode;
  /** Seconds of delay, for hand-ordered sequences. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span' | 'p';
}

/**
 * Fades content up as it scrolls into view, once.
 *
 * `once` matters: re-animating on every pass turns scrolling back up into a
 * distraction, and Vercel's own reveals do not replay.
 *
 * Honours prefers-reduced-motion by rendering the final state immediately.
 * Motion sickness and vestibular disorders are real, and a decorative fade is
 * never worth making someone feel unwell.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: MOTION.rise }}
      whileInView={{ opacity: 1, y: 0 }}
      // The negative margin holds the trigger back until the element is
      // properly on screen, so it is not already half read by the time it
      // finishes arriving.
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: MOTION.duration, ease: MOTION.easeOut, delay }}
    >
      {children}
    </Component>
  );
}

/**
 * Staggers its children in as the group scrolls into view.
 *
 * Wrap items in `RevealItem`. Used for lists, where animating each child on
 * its own observer makes the sequence depend on scroll speed rather than
 * reading as one deliberate cascade.
 */
export function RevealGroup({
  children,
  className,
  delay = 0,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: MOTION.stagger, delayChildren: delay } },
      }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: Omit<RevealProps, 'delay'>) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: MOTION.rise },
        shown: { opacity: 1, y: 0 },
      }}
      transition={{ duration: MOTION.duration, ease: MOTION.easeOut }}
    >
      {children}
    </Component>
  );
}
