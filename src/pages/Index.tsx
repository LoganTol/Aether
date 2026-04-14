import { Link } from "react-router-dom";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import ProductCarousel from "@/components/ProductCarousel";

const productImages = [
  { src: product1, alt: "Solo Tennis Trainer - Overview" },
  { src: product2, alt: "Solo Tennis Trainer - Features Detail" },
  { src: product3, alt: "Solo Tennis Trainer - How To Use" },
];

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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 w-full py-8 z-50">
        <div className="container flex justify-between items-center">
          <Link to="/" className="font-heading text-3xl font-bold tracking-wide">
            AETHER<span className="text-primary">.</span>
          </Link>
          <Link
            to="/order"
            className="inline-block px-8 py-3 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)]"
          >
            Buy Now
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Background glow */}
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(var(--secondary))_0%,transparent_70%)] opacity-50 blur-[80px] -z-10" />

        <div className="container grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-up">Master Your Game Solo.</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-up-delay-1">
              The ultimate Tennis Trainer Rebound Base. Practice your strokes anywhere, anytime. Simply fill the base
              with water or sand, and start striking.
            </p>
            <div className="flex items-center gap-4 font-heading text-4xl font-bold mb-8 justify-center lg:justify-start animate-fade-up-delay-2">
              <span>$14.99</span>
              <span className="text-muted-foreground text-2xl line-through">$17.99</span>
            </div>
            <div className="animate-fade-up-delay-3">
              <Link
                to="/order"
                className="inline-block px-10 py-4 text-lg font-semibold rounded-full bg-primary text-primary-foreground glow-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_hsl(73_100%_50%/0.4)]"
              >
                Purchase
              </Link>
            </div>
          </div>
          <div className="animate-fade-up-delay-1">
            <ProductCarousel images={productImages} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card p-10 transition-all duration-300 hover:-translate-y-2.5 hover:border-primary/30 hover:glow-shadow"
              >
                <div className="text-4xl mb-6">{f.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
