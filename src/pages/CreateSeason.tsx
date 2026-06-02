import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SeasonWizard from "@/components/season-wizard/SeasonWizard";

export default function CreateSeason() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-3xl">
        <button
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <SeasonWizard />
      </main>
    </div>
  );
}