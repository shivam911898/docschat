// DocsChat mark: a speech bubble on a primary tile. Same artwork as public/favicon.svg.
export default function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#4F46E5" />
      <path fill="#fff" d="M9 9.5A2.5 2.5 0 0 1 11.5 7h9A2.5 2.5 0 0 1 23 9.5v6a2.5 2.5 0 0 1-2.5 2.5H15l-4.2 3.6a.5.5 0 0 1-.8-.4V18h-.5A2.5 2.5 0 0 1 9 15.5z" />
      <circle cx="12.6" cy="12.5" r="1.2" fill="#4F46E5" />
      <circle cx="16" cy="12.5" r="1.2" fill="#4F46E5" />
      <circle cx="19.4" cy="12.5" r="1.2" fill="#4F46E5" />
    </svg>
  );
}
