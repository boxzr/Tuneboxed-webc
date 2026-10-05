import { Fragment } from 'react';
import { Link } from 'react-router-dom';

const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

/**
 * Translated copy with a little inline markup: [label](/path), **bold**, `code`.
 * Keeps links inside the sentence, where word order differs by language.
 */
export default function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, label, href, bold, code] = m;
    if (label !== undefined) {
      out.push(
        href.startsWith('/') && !href.startsWith('/tv/') ? (
          <Link key={at} to={href}>
            {label}
          </Link>
        ) : (
          <a key={at} href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {label}
          </a>
        )
      );
    } else if (bold !== undefined) {
      out.push(<strong key={at}>{bold}</strong>);
    } else if (code !== undefined) {
      out.push(<code key={at}>{code}</code>);
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

/** The same copy with the markup stripped, for meta tags and structured data. */
export function plain(text: string): string {
  return text.replace(TOKEN, (_, label, _href, bold, code) => label ?? bold ?? code ?? '');
}
