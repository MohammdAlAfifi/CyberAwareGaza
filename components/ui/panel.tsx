import type { ElementType, ReactNode } from "react";

export function Panel({
  as: Component = "section",
  children,
  className = "",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Component className={`panel ${className}`.trim()}>{children}</Component>
  );
}
