import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function CardHeader({
  icon,
  title,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex items-center justify-between gap-3 px-5 py-4 ${className}`}
    >
      <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-mist-100">
        {icon && <span className="text-lime-400">{icon}</span>}
        {title}
      </h2>
      {action}
    </header>
  );
}
