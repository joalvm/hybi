import { Markdown } from '@/shared/markdown/Markdown.js';

type Props = {
  /** `EventItem.description`: what the AsyncAPI document said about the message. */
  description: string | undefined;
};

/** The message read as prose. Markdown, because that is what a summary is written in. */
export function DocsView({ description }: Props) {
  if (description === undefined || description.trim() === '') {
    return <p className="app-state">Este evento no tiene descripción.</p>;
  }

  return (
    <div className="composer-docs">
      <Markdown source={description} />
    </div>
  );
}
