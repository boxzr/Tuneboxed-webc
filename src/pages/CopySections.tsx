import Rich from '../i18n/Rich';
import type { Section } from '../i18n/content/en';

export function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
    </>
  );
}

export function CopySection({ section }: { section: Section }) {
  return (
    <section className="page-section">
      <h2>{section.heading}</h2>
      <Paragraphs items={section.paragraphs} />
      {section.parts?.map((part) => (
        <div key={part.title}>
          <h3>{part.title}</h3>
          <Paragraphs items={part.paragraphs} />
        </div>
      ))}
    </section>
  );
}

export function Steps({ steps }: { steps: { title: string; body?: string; paragraphs?: string[] }[] }) {
  return (
    <ol className="page-steps">
      {steps.map((s, i) => (
        <li key={s.title}>
          <span className="page-step-num">{i + 1}</span>
          <div className="page-step-body">
            <h3>{s.title}</h3>
            {s.body && (
              <p>
                <Rich text={s.body} />
              </p>
            )}
            {s.paragraphs && <Paragraphs items={s.paragraphs} />}
          </div>
        </li>
      ))}
    </ol>
  );
}
