import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import pickleball1 from "@/assets/pickleball-1.jpg";
import pickleball2 from "@/assets/pickleball-2.jpg";
import ProductCarousel from "@/components/ProductCarousel";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const tennisImages = [
  { src: product1, alt: "Solo Tennis Trainer - Overview" },
  { src: product2, alt: "Solo Tennis Trainer - Features Detail" },
  { src: product3, alt: "Solo Tennis Trainer - How To Use" },
];

const pickleballImages = [
  { src: pickleball1, alt: "Solo Pickle Ball Trainer - Overview" },
  { src: pickleball2, alt: "Solo Pickle Ball Trainer - Features Detail" },
];

const products = {
  tennis: {
    id: "tennis",
    label: "Tennis",
    name: "Solo Tennis Trainer",
    subtitle: "With Rebound Ball & Rope",
    tagline: "The ultimate Tennis Trainer Rebound Base. Practice your strokes anywhere, anytime. Simply fill the base with water or sand, and start striking.",
    images: tennisImages,
    price: 14.99,
    priceId: "solo_trainer_one_time",
    summaryImg: product1,
  },
  pickleball: {
    id: "pickleball",
    label: "Pickleball",
    name: "Solo Pickle Ball Trainer",
    subtitle: "With Rebound Ball & Rope",
    tagline: "The ultimate Pickleball Trainer Rebound Base. Sharpen your dinks and drives anywhere, anytime. Simply fill the base with water or sand, and start playing.",
    images: pickleballImages,
    price: 14.99,
    priceId: "solo_trainer_one_time",
    summaryImg: pickleball1,
  },
};

type Sport = keyof typeof products;

const features = [
  {
    icon: "🌊",
    title: "Stable Base",
    desc: "Fill the robust PE material base with water or sand. Anti-slip strips keep it firmly in place during intense practice.",
  },
  {
    icon: "🎾",
    title: "High-Elastic Rope",
    desc: "Strong, durable elastic rope with an easy-tie hook provides a steady rebound for repetitive stroke training.",
  },
  {
    icon: "🎒",
    title: "Portable Design",
    desc: "Lightweight and convenient to pack. Take it to the park, driveway, or court. Offers a large 4-7 meter strike range.",
  },
];

const Index = () => {
  const [sport, setSport] = useState<Sport>("tennis");
  const active = products[sport];
  const { addItem, totalItems } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addItem({
      id: active.id,
      name: active.name,
      subtitle: active.subtitle,
      price: active.price,
      image: active.summaryImg,
      priceId: active.priceId,
    });
    toast({
      title: "Added to cart",
      description: `${active.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 w-full py-4 md:py-8 z-50 bg-background/80 backdrop-blur-md">
        <div className="container flex justify-between items-center">
          <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
            AETHER<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate("/order")}
              className="relative p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <Link
              to="/order"
              className="inline-block px-5 py-2 text-sm md:px-8 md:py-3 md:text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)]"
            >
              Buy Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Background glows */}
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(var(--secondary))_0%,transparent_70%)] opacity-50 blur-[80px] -z-10" />
        <div className="absolute bottom-[10%] -left-[5%] w-[400px] h-[400px] bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)] blur-[60px] -z-10" />

        <div className="container grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
          <div className="text-center lg:text-left">
            {/* Sport Toggle */}
            <div className="inline-flex items-center rounded-full border border-border bg-black/30 p-1 mb-6 animate-fade-up relative z-50">
              {(Object.keys(products) as Sport[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSport(key)}
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                    sport === key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {products[key].label}
                </button>
              ))}
            </div>

            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4 animate-fade-up">Train Smarter</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-up">
              Master Your <span className="text-primary">Game</span> Solo.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-up-delay-1">
              {active.tagline}
            </p>
            <div className="flex items-center gap-4 font-heading text-4xl font-bold mb-8 justify-center lg:justify-start animate-fade-up-delay-2">
              <span className="text-primary">$14.99</span>
              <span className="text-muted-foreground text-2xl line-through">$17.99</span>
              <span className="ml-2 px-3 py-1 text-xs font-bold rounded-full bg-primary/20 text-primary border border-primary/30">SAVE 17%</span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-3 animate-fade-up-delay-3">
              <Link
                to="/order"
                className="inline-block px-10 py-4 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)]"
              >
                Order Now →
              </Link>
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>
          </div>
          <div key={sport} className="animate-fade-up-delay-1">
            <ProductCarousel images={active.images} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why <span className="text-primary">Athletes</span> Love It
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">Built for serious practice, designed for everyone.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card p-10 transition-all duration-300 hover:-translate-y-2.5 hover:border-primary/30 hover:glow-shadow group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mb-6 group-hover:bg-primary/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Aether Tennis. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
    </div>
  );
};

export default Index;
