import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function WikiMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-[var(--font-display)] prose-headings:text-foreground prose-a:text-[color:var(--arcane)] prose-strong:text-foreground prose-img:rounded-lg prose-img:border prose-img:border-border prose-blockquote:border-l-[color:var(--arcane)] prose-blockquote:text-muted-foreground prose-code:text-[color:var(--frost)] prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
