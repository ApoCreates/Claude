import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}
export function CardHeader({ title, action, kicker }: { title: React.ReactNode; action?: React.ReactNode; kicker?: React.ReactNode }) {
  return (
    <div className="card-hd">
      <div>
        {kicker && <div className="label">{kicker}</div>}
        <div className="text-sm font-medium">{title}</div>
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card-bd", className)}>{children}</div>;
}
