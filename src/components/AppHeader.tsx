import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AetherLogo from "@/components/AetherLogo";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 w-full py-4 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex justify-between items-center">
        <AetherLogo to={user ? "/app" : "/"} className="text-2xl" />
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link
                to="/app"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <span className="hidden md:inline text-xs text-muted-foreground px-2">
                {user.email}
              </span>
              <Link
                to="/app/home"
                className="p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                aria-label="Home"
              >
                <Home size={16} />
              </Link>
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}