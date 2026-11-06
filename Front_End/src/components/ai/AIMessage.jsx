import { Sprout } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

function AIMessage({ message }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 pr-4 sm:pr-12">
      {/* Bot Avatar */}
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-chaybook-primary text-white shadow-xs">
        <Sprout className="h-5 w-5" />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Assistant Header & Meta */}
        <div className="flex items-center gap-2 px-1 text-xs">
          <span className="font-semibold text-gray-900">
            AI Nutrition Assistant
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            ChayBot
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">
            {message.createdAt || "Just now"}
          </span>
        </div>

        {/* Render the assistant response as Markdown. */}
        <div className="rounded-2xl rounded-tl-xs bg-white p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="break-words text-sm sm:text-[15px] leading-relaxed text-gray-800 font-normal [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-3 whitespace-pre-wrap">{children}</p>,
                h1: ({ children }) => <h1 className="mt-5 mb-2 text-xl font-bold text-gray-900">{children}</h1>,
                h2: ({ children }) => <h2 className="mt-5 mb-2 text-lg font-bold text-gray-900">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-4 mb-2 text-base font-bold text-gray-900">{children}</h3>,
                ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
                ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-emerald-300 pl-4 text-gray-600">{children}</blockquote>,
                code: ({ children, className }) => (
                  <code className={`${className ?? ""} rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em]`}>
                    {children}
                  </code>
                ),
                pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-sm text-gray-100">{children}</pre>,
                a: ({ children, href }) => href?.startsWith("/")
                  ? <Link className="text-emerald-700 underline underline-offset-2" to={href}>{children}</Link>
                  : <a className="text-emerald-700 underline underline-offset-2" href={href} target="_blank" rel="noreferrer">{children}</a>,
              }}
            >
              {message.content ?? ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMessage;
