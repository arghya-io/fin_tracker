import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Handshake, MessageCircle, PiggyBank, Users } from "lucide-react";
import { useUnreadCount } from "@/hooks/useChat";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Txns", url: "/transactions", icon: ArrowLeftRight },
  { title: "Debt", url: "/debt", icon: Handshake },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Budget", url: "/budgets", icon: PiggyBank },
];

export function MobileBottomNav() {
  const location = useLocation();
  const unreadCount = useUnreadCount();

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
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 text-[11px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.title === "Chat" && unreadCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] bg-primary text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </span>
              <span>{item.title}</span>
            </Link>
          );
        })}
        <a
          href="/split"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-[11px] text-muted-foreground transition-colors"
        >
          <Users className="h-5 w-5" />
          <span>Split</span>
        </a>
      </div>
    </nav>
  );
}
