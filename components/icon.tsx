import type { ReactNode } from "react";

export type IconName =
  | "alert"
  | "arrow"
  | "assessment"
  | "chart"
  | "check"
  | "clock"
  | "close"
  | "globe"
  | "home"
  | "login"
  | "menu"
  | "refresh"
  | "settings"
  | "shield"
  | "upload"
  | "user"
  | "users";

const paths: Record<IconName, ReactNode> = {
  alert: <path d="M12 3 2.8 20h18.4L12 3Zm0 6v4.5m0 3.5v.1" />,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
  assessment: <path d="M7 4h10v16H7zM9.5 8h5M9.5 12h5M9.5 16h3" />,
  chart: <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 2h6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  globe: (
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18M4.9 7h14.2M4.9 17h14.2" />
  ),
  home: <path d="m3 11 9-8 9 8v9h-6v-6H9v6H3z" />,
  login: <path d="M10 5H4v14h6m4-4 4-3-4-3m4 3H8" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  refresh: (
    <path d="M20 6v5h-5M4 18v-5h5m10-2a7 7 0 0 0-12-4L4 11m16 2-3 4a7 7 0 0 1-12-4" />
  ),
  settings: (
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6L16.5 7.5m-9 9L6 18m12 0-1.5-1.5m-9-9L6 6" />
  ),
  shield: (
    <path d="M12 3 4.5 6v5.5c0 4.4 3 7.8 7.5 9.5 4.5-1.7 7.5-5.1 7.5-9.5V6L12 3Zm-3 9 2 2 4-5" />
  ),
  upload: <path d="M12 16V4m-4 4 4-4 4 4M5 14v6h14v-6" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  users: (
    <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0m1-9a3 3 0 1 0 0-6m1 9a6 6 0 0 1 4 6" />
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}
