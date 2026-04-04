import { ExternalLink } from "lucide-react";

interface SourceLink {
  label: string;
  url: string | null;
}

export function SourceLinkButtons({ links }: { links: SourceLink[] }) {
  return (
    <div className="flex gap-1.5">
      {links
        .filter((l) => l.url)
        .map((link) => (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
          >
            <ExternalLink className="w-3 h-3" />
            {link.label}
          </a>
        ))}
    </div>
  );
}
