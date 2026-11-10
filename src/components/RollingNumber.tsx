import { useEffect, useRef, useState } from 'react';
import './rollingNumber.css';

interface Props {
  value: number;
  locale?: string;
  /** Roll up from zero the first time the number scrolls into view. */
  countUpOnView?: boolean;
  className?: string;
}

/**
 * A number whose digits roll like an odometer when it changes.
 *
 * Each digit is a column of 0–9 shifted with a transform, so a vote landing
 * reads as the count physically ticking over instead of a text swap. Screen
 * readers get the plain formatted number.
 */
export default function RollingNumber({ value, locale, countUpOnView = false, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(!countUpOnView);

  useEffect(() => {
    if (!countUpOnView || visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [countUpOnView, visible]);

  const formatted = value.toLocaleString(locale);
  const shown = visible ? formatted : formatted.replace(/\d/g, '0');

  return (
    <span ref={ref} className={`rolling-number${className ? ` ${className}` : ''}`}>
      <span className="rolling-number__sr">{formatted}</span>
      <span className="rolling-number__digits" aria-hidden="true">
        {shown.split('').map((ch, i) => {
          // Keyed from the right so adding a digit on the left does not make
          // every existing column roll.
          const key = shown.length - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`s${key}`} className="rolling-number__sep">
                {ch}
              </span>
            );
          }
          const d = Number(ch);
          return (
            <span key={`d${key}`} className="rolling-number__col">
              <span
                className="rolling-number__strip"
                style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: `${(shown.length - i) * 40}ms` }}
              >
                {'0123456789'.split('').map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
