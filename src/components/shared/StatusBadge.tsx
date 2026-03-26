import { cn } from "@/lib/utils";

type StatusType = "draft" | "pending" | "active" | "error" | "info";

const statusMap: Record<string, StatusType> = {
  draft: "draft",
  sent: "info",
  approved: "active",
  rejected: "error",
  pending: "pending",
  "in progress": "pending",
  complete: "active",
  paid: "active",
  overdue: "error",
  inactive: "draft",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const type = statusMap[status.toLowerCase()] ?? "draft";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        type === "draft" && "status-badge-draft",
        type === "pending" && "status-badge-pending",
        type === "active" && "status-badge-active",
        type === "error" && "status-badge-error",
        type === "info" && "status-badge-info",
        className
      )}
    >
      {status}
    </span>
  );
}
