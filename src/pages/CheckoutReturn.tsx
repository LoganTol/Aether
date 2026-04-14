import { useSearchParams, Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8">
      <div className="glass-card p-12 soft-shadow max-w-lg text-center">
        {sessionId ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your Solo Tennis Trainer is on its way!
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❓</div>
            <h1 className="text-3xl font-bold mb-2">No Order Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find your order information.
            </p>
          </>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:-translate-y-0.5 transition-all"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
