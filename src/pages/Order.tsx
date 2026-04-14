import { Link } from "react-router-dom";
import { useState } from "react";
import productImg from "@/assets/product-summary.jpg";

const Order = () => {
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        alert("Thank you for your order! This was a demo submission.");
        setStatus("idle");
      }, 1500);
    }, 2000);
  };

  const btnText = status === "processing" ? "Processing..." : status === "success" ? "✓ Order Confirmed!" : "Complete Order • $17.98";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-8 text-center">
        <Link to="/" className="font-heading text-3xl font-bold tracking-wide">
          AETHER<span className="text-primary">.</span>
        </Link>
      </header>

      {/* Checkout */}
      <section className="min-h-screen flex items-center justify-center px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 max-w-[1100px] w-full">
          {/* Form */}
          <div className="glass-card p-12 soft-shadow">
            <div className="mb-8 border-b border-border pb-4">
              <h2 className="text-3xl font-bold">Secure Checkout</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold">Contact Information</h3>
              <div className="mt-4 mb-6">
                <label className="block mb-2 text-sm font-semibold text-muted-foreground">Email Address</label>
                <input type="email" required placeholder="player@example.com" className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <h3 className="text-xl font-bold mt-8">Shipping Address</h3>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">First Name</label>
                  <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">Last Name</label>
                  <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="mt-4 mb-6">
                <label className="block mb-2 text-sm font-semibold text-muted-foreground">Address</label>
                <input type="text" required placeholder="123 Court St" className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">City</label>
                  <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">State / Province</label>
                  <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">ZIP / Postal Code</label>
                  <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <h3 className="text-xl font-bold mt-8">Payment</h3>
              <div className="mt-4 mb-6">
                <label className="block mb-2 text-sm font-semibold text-muted-foreground">Name on Card</label>
                <input type="text" required className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-semibold text-muted-foreground">Card Number</label>
                <input type="text" required placeholder="0000 0000 0000 0000" className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">Expiration Date (MM/YY)</label>
                  <input type="text" required placeholder="MM/YY" className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-muted-foreground">CVV</label>
                  <input type="text" required placeholder="123" className="w-full bg-black/30 border border-border rounded-xl px-5 py-4 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-3 font-semibold tracking-wide uppercase">Accepted Payments</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay"].map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/30 border border-border text-muted-foreground"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Summary */}
          <div className="glass-card p-12 soft-shadow h-fit">
            <div className="mb-8 border-b border-border pb-4">
              <h2 className="text-3xl font-bold">Order Summary</h2>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <img src={productImg} alt="Solo Tennis Trainer" className="w-20 h-20 object-cover rounded-xl border border-border" loading="lazy" width={80} height={80} />
              <div>
                <h4 className="text-lg font-bold">Solo Tennis Trainer</h4>
                <p className="text-muted-foreground text-sm">With Rebound Ball & Rope</p>
              </div>
              <span className="ml-auto font-semibold">$14.99</span>
            </div>

            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Subtotal</span><span>$14.99</span>
            </div>
            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Shipping (Express)</span><span>$2.99</span>
            </div>
            <div className="flex justify-between py-4 border-b border-dashed border-border">
              <span>Taxes</span><span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            <div className="flex justify-between py-4 mt-4 text-2xl font-bold text-primary">
              <span>Total</span><span>$17.98</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={status !== "idle"}
              className={`w-full mt-6 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
                status === "success"
                  ? "bg-green-500 text-foreground shadow-[0_0_20px_rgba(76,175,80,0.4)]"
                  : "bg-primary text-primary-foreground glow-shadow hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)]"
              } ${status === "processing" ? "opacity-70" : ""}`}
            >
              {btnText}
            </button>

            <p className="text-muted-foreground text-sm text-center mt-6">
              🔒 Secure checkout · 256-bit SSL encryption
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Order;
