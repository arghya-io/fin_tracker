import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Handshake, BarChart3, PiggyBank } from "lucide-react";

const NAV_ITEMS = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Txns", url: "/transactions", icon: ArrowLeftRight },
  { title: "Debt", url: "/debt", icon: Handshake },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Budget", url: "/budgets", icon: PiggyBank },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-card/95 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
