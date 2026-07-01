import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { CalloutBlock } from "@/lib/blog";

export function Callout({ block }: { block: CalloutBlock }) {
  const { variant, title, content } = block;

  const variants = {
    info: {
      icon: Info,
      classes: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300",
      iconColor: "text-blue-500",
    },
    warning: {
      icon: TriangleAlert,
      classes: "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-300",
      iconColor: "text-yellow-500",
    },
    danger: {
      icon: AlertCircle,
      classes: "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300",
      iconColor: "text-red-500",
    },
    success: {
      icon: CheckCircle2,
      classes: "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300",
      iconColor: "text-green-500",
    },
    tip: {
      icon: Lightbulb,
      classes: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300",
      iconColor: "text-purple-500",
    },
  };

  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div className={cn("my-6 rounded-lg border p-4", config.classes)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1">
          {title && (
            <h5 className="font-semibold mb-1 leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
