import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = { source: string };

/**
 * CommonMark and GFM rendered as a sanitized React tree. Raw HTML is parsed so
 * valid Markdown is not silently dropped, then sanitized before React sees it.
 */
export function Markdown({ source }: Props) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
