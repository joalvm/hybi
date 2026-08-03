import { Markdown } from '@/shared/markdown/Markdown.js';

type Props = {
  /** `EventItem.description`: what the AsyncAPI document said about the message. */
  description: string | undefined;
};

/** The message read as prose. Markdown, because that is what a summary is written in. */
export function DocsView({ description }: Props) {
  if (description === undefined || description.trim() === '') {
    return <p className="p-3 text-muted">Este evento no tiene descripción.</p>;
  }

  return (
    <div className="px-4 py-3">
      <Markdown source={description} />
    </div>
  );
}
