import { LucideIcon } from "lucide-react";

interface QuickAction {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({
  actions,
}: QuickActionsProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={action.onClick}
              className="
                rounded-xl
                border
                p-6
                transition-all
                duration-300
                hover:bg-sky-50
                hover:shadow-md
                hover:-translate-y-1
              "
            >
              <Icon
                size={32}
                className="mx-auto mb-3 text-sky-700"
              />

              <p className="font-medium">
                {action.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}