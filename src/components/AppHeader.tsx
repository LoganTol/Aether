import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AetherLogo from "@/components/AetherLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app", label: "Seasons", icon: LayoutDashboard },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md transition-colors duration-300 hover:border-primary/30 hover:bg-primary/25">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <AetherLogo to={user ? "/app/home" : "/"} className="text-2xl sm:text-3xl" />

        {user && (
          <nav className="flex items-center gap-1" aria-label="Main">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = to === "/app" ? pathname === "/app" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[hsl(var(--surface-2))] text-foreground"
                      : "text-[hsl(var(--text-muted))] hover:text-foreground",
                  )}
                >
                  <Icon size={16} aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            <span className="mx-1 hidden h-5 w-px bg-border lg:block" aria-hidden />
            <span className="text-meta hidden max-w-[14rem] truncate lg:block">{user.email}</span>

            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="ml-1 rounded-lg p-2 text-[hsl(var(--text-muted))] transition-colors hover:bg-[hsl(var(--surface-2))] hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut size={16} aria-hidden />
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
