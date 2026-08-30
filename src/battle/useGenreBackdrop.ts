import { useEffect, useState } from 'react';
import { findGenreImage } from './genreBackdrop';

/** A cartoon URL for this prompt, or null while searching / when nothing turned up. */
export function useGenreBackdrop(genre: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setUrl(null);
    if (!genre) return;
    void findGenreImage(genre).then((next) => {
      if (live) setUrl(next);
    });
    return () => {
      live = false;
    };
  }, [genre]);

  return url;
}
