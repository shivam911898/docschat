// Small inline stroke icons (24px grid). Decorative: always aria-hidden, the label lives in the surrounding text.
import type { ReactNode } from "react";

type P = { size?: number; className?: string };

function Svg({ size = 18, className, children }: P & { children: ReactNode }) {
  return (
    <svg
      className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
    >
      {children}
    </svg>
  );
}

export const FileIcon = (p: P) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Svg>
);
export const UploadIcon = (p: P) => (
  <Svg {...p}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></Svg>
);
export const CopyIcon = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Svg>
);
export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
);
export const EyeIcon = (p: P) => (
  <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const EyeOffIcon = (p: P) => (
  <Svg {...p}><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2" /><path d="M6.6 6.7A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>
);
export const ArrowUpIcon = (p: P) => (
  <Svg {...p}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></Svg>
);
export const XIcon = (p: P) => (
  <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
);
export const TrashIcon = (p: P) => (
  <Svg {...p}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4h6v3" /></Svg>
);
export const InboxIcon = (p: P) => (
  <Svg {...p}><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></Svg>
);
export const CodeIcon = (p: P) => (
  <Svg {...p}><path d="m8 7-5 5 5 5" /><path d="m16 7 5 5-5 5" /><path d="m14 4-4 16" /></Svg>
);
export const ShieldIcon = (p: P) => (
  <Svg {...p}><path d="M12 3 4 6v6c0 4.4 3.2 8 8 9 4.8-1 8-4.6 8-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></Svg>
);
export const HelpIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8" /><path d="M12 17h.01" /></Svg>
);
export const LayoutIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M9 9v11" /></Svg>
);
export const ChatIcon = (p: P) => (
  <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>
);
export const LogOutIcon = (p: P) => (
  <Svg {...p}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m16 8 4 4-4 4" /><path d="M20 12H9" /></Svg>
);
export const AlertIcon = (p: P) => (
  <Svg {...p}><path d="M12 3 2 20h20z" /><path d="M12 10v4" /><path d="M12 17h.01" /></Svg>
);
