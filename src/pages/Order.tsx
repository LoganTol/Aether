import { Link } from "react-router-dom";
import { useState } from "react";
import { Home, Minus, Plus, Trash2 } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useCart } from "@/contexts/CartContext";

const SHIPPING = 2.99;

const Order = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  const total = (subtotal + SHIPPING).toFixed(2);

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
            {items.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
                <p className="text-muted-foreground mb-8">Add some products to get started.</p>
                <Link
                  to="/"
                  className="inline-block px-8 py-3 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5"
                >
                  Browse Products
                </Link>
              </div>
            ) : !showCheckout ? (
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
                  quantity={items.reduce((sum, i) => sum + i.quantity, 0)}
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
              {items.length > 0 && (
                <p className="text-muted-foreground text-sm mt-1">{items.length} item{items.length > 1 ? "s" : ""} in cart</p>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No items in cart</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-secondary/20 border border-secondary/30">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl border border-primary/20"
                          loading="lazy"
                          width={64}
                          height={64}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold truncate">{item.name}</h4>
                          <p className="text-muted-foreground text-xs">{item.subtitle}</p>
                          <span className="text-primary font-semibold text-sm">${item.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={showCheckout}
                          className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {/* Quantity */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground">Qty</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || showCheckout}
                            className="w-7 h-7 rounded-lg border border-border bg-black/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={showCheckout}
                            className="w-7 h-7 rounded-lg border border-border bg-black/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-between py-4 border-b border-dashed border-border">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
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
              </>
            )}

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
