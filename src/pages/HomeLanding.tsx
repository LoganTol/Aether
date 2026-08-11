import { Link } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Trophy, UserCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AetherLogo from "@/components/AetherLogo";
import { useAuth } from "@/contexts/AuthContext";
import { PageContainer, Surface } from "@/components/ui-system";

const tiles = [
  { to: "/app", icon: LayoutDashboard, title: "My Seasons", desc: "Jump into any season you're playing or running." },
  { to: "/app/seasons/new", icon: PlusCircle, title: "Start a Season", desc: "Launch a new round-robin season in minutes." },
  { to: "/app", icon: Trophy, title: "Standings", desc: "See where you stand across active seasons." },
  { to: "/app", icon: UserCircle, title: "Account", desc: "Manage your profile and notifications." },
];

export default function HomeLanding() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <PageContainer width="narrow" className="py-16">
          <div className="text-center mb-12 animate-fade-up">
            <AetherLogo className="text-5xl md:text-6xl justify-center" />
            <p className="mt-4 text-body">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}. Where to?
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up-delay-1">
            {tiles.map(({ to, icon: Icon, title, desc }) => (
              <Link key={title} to={to}>
                <Surface level={2} interactive className="group h-full">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={22} aria-hidden />
                  </div>
                  <h3 className="text-ui-title text-lg">{title}</h3>
                  <p className="text-body mt-1">{desc}</p>
                </Surface>
              </Link>
            ))}
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
