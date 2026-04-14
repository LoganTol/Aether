import { Link } from "react-router-dom";
import { useState } from "react";
import { Home, Minus, Plus } from "lucide-react";
import productImg from "@/assets/product-summary.jpg";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const UNIT_PRICE = 14.99;
const SHIPPING = 2.99;

const Order = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);

  const subtotal = (UNIT_PRICE * quantity).toFixed(2);
  const total = (UNIT_PRICE * quantity + SHIPPING).toFixed(2);

  return (
    <div className="min-h-screen bg-background relative">
      <PaymentTestModeBanner />

      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(var(--primary)/0.06)_0%,transparent_70%)] blur-[60px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,hsl(var(--secondary)/0.15)_0%,transparent_70%)] blur-[60px] -z-10" />

      {/* Header */}
      <header className="py-8 px-8 flex items-center justify-between max-w-[1100px] mx-auto">
        <Link to="/" className="p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" aria-label="Back to home">
          <Home size={20} />
        </Link>
        <Link to="/" className="font-heading text-3xl font-bold tracking-wide">
          AETHER<span className="text-primary">.</span>
        </Link>
        <div className="w-9" />
      </header>

      {/* Checkout */}
      <section className="min-h-screen flex items-center justify-center px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 max-w-[1100px] w-full">
          {/* Left side - Form or Stripe Checkout */}
          <div className="glass-card p-12 soft-shadow">
            {!showCheckout ? (
              <>
                <div className="mb-8 border-b border-border pb-4">
                  <h2 className="text-3xl font-bold">Checkout</h2>
                  <p className="text-muted-foreground text-sm mt-1">Enter your email to continue to payment</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setShowCheckout(true); }}>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs flex items-center justify-center font-bold">1</span>
                    Contact Information
                  </h3>
                  <div className="mt-4 mb-6">
                    <label className="block mb-2 text-sm font-semibold text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@example.com"
                      className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 px-8 py-4 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)] transition-all duration-300"
                  >
                    Continue to Payment
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-8 border-b border-border pb-4">
                  <h2 className="text-3xl font-bold">Payment</h2>
                  <p className="text-muted-foreground text-sm mt-1">Complete your purchase securely</p>
                </div>

                <StripeEmbeddedCheckout
                  priceId="solo_trainer_one_time"
                  quantity={quantity}
                  customerEmail={email}
                  returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                />

                <button
                  onClick={() => setShowCheckout(false)}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to contact info
                </button>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="glass-card p-12 soft-shadow h-fit border-t-2 border-t-primary/30">
            <div className="mb-8 border-b border-border pb-4">
              <h2 className="text-3xl font-bold">Order Summary</h2>
            </div>

            <div className="flex items-center gap-6 mb-4 p-4 rounded-xl bg-secondary/20 border border-secondary/30">
              <img src={productImg} alt="Solo Tennis Trainer" className="w-20 h-20 object-cover rounded-xl border border-primary/20" loading="lazy" width={80} height={80} />
              <div>
                <h4 className="text-lg font-bold">Solo Tennis Trainer</h4>
                <p className="text-muted-foreground text-sm">With Rebound Ball & Rope</p>
              </div>
              <span className="ml-auto font-semibold text-primary">${UNIT_PRICE.toFixed(2)}</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-8 p-4 rounded-xl bg-secondary/10 border border-border">
              <span className="text-sm font-semibold text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || showCheckout}
                  className="w-9 h-9 rounded-lg border border-border bg-black/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={showCheckout}
                  className="w-9 h-9 rounded-lg border border-border bg-black/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Subtotal ({quantity}×)</span><span>${subtotal}</span>
            </div>
            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Shipping (Express)</span><span>${SHIPPING.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Taxes</span><span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            <div className="flex justify-between py-4 mt-4 text-2xl font-bold text-primary">
              <span>Total</span><span>${total}</span>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3 font-semibold tracking-wide uppercase">Accepted Payments</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay"].map((method) => (
                  <span
                    key={method}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/5 border border-primary/20 text-primary/80"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-muted-foreground text-sm text-center mt-6">
              🔒 Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Order;
