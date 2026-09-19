import { Fragment } from "react";
import { ExternalLink } from "lucide-react";

const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

export function renderAnswerWithLinks(content: string) {
  const parts = content.split(URL_PATTERN);
  return parts.map((part, index) => {
    if (part.match(URL_PATTERN)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-0.5 inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2 py-0.5 align-middle text-xs font-medium text-navy-900 hover:bg-navy-900/10"
        >
          Ko‘rish
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
