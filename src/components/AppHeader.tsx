import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 w-full py-4 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex justify-between items-center">
        <Link to={user ? "/app" : "/"} className="font-heading text-2xl font-bold tracking-wide">
          AETHER<span className="text-primary">.</span>
        </Link>
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