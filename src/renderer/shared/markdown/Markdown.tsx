import { memo } from 'react';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Module constants, not literals in the JSX. A fresh array is a changed prop, and
 * a changed prop makes `react-markdown` rebuild its whole unified pipeline before
 * parsing anything.
 */
const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, rehypeSanitize, rehypeHighlight];

type Props = { source: string };

/**
 * CommonMark and GFM rendered as a sanitized React tree. Raw HTML is parsed so
 * valid Markdown is not silently dropped, then sanitized before React sees it.
 *
 * Memoized because the parse is the most expensive render in the app and its
 * input barely changes: the docs pane lives inside the composer, so without this
 * every keystroke in the payload editor re-ran remark, rehype and the syntax
 * highlighter over documentation nobody was editing.
 */
export const Markdown = memo(function Markdown({ source }: Props) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
        {source}
      </ReactMarkdown>
    </div>
  );
});
