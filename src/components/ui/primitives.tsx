import type {ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TableHTMLAttributes} from "react";
import {ChevronDown, type LucideIcon} from "lucide-react";
import {cn} from "@/lib/utils";

export function Input({className, ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ds-input", className)} {...props} />;
}

export function Select({className, children, ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="ds-select-wrap">
      <select className={cn("ds-select", className)} {...props}>{children}</select>
      <ChevronDown aria-hidden="true" className="ds-select-icon" size={16} />
    </span>
  );
}

export function Table({className, children, ...props}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ds-table-scroll">
      <table className={cn("ds-table", className)} {...props}>{children}</table>
    </div>
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "brand";
}) {
  return <span className={cn("ds-badge", `ds-badge-${tone}`, className)}>{children}</span>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`ds-empty${compact ? " ds-empty-compact" : ""}`}>
      <span className="ds-empty-icon"><Icon aria-hidden="true" size={20} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="ds-empty-action">{action}</div>}
    </div>
  );
}

export function Skeleton({className, ...props}: {className?: string; "aria-label"?: string}) {
  return <span aria-hidden="true" className={cn("ds-skeleton", className)} {...props} />;
}