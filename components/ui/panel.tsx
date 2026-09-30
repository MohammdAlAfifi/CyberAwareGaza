import type { ElementType, HTMLAttributes, ReactNode } from "react";

export function Panel({
  as: Component = "section",
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
}) {
  return (
    <Component className={`panel ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
