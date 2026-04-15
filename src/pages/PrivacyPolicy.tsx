import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 w-full py-4 md:py-8 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
            AETHER<span className="text-primary">.</span>
          </Link>
        </div>
      </div>
    </header>

    <main className="container max-w-3xl py-12 space-y-8">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Effective Date: April 2026</p>
      <p>At Aether Tennis, one of our main priorities is the privacy of our visitors. This Privacy Policy describes the types of information we collect and how we use it.</p>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
        <p className="text-muted-foreground"><strong>Personal Information:</strong> We collect information that you voluntarily provide when you register, place an order, or subscribe to our newsletter — including your name, email address, mailing address, and phone number.</p>
        <p className="text-muted-foreground"><strong>Payment Data:</strong> All payments are processed through secure third-party gateways. We do not store or collect your payment card details on our servers.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">2. Log Files and Cookies</h2>
        <p className="text-muted-foreground">We follow standard procedures of using log files and cookies. This information is not linked to anything personally identifiable and is used to optimize your experience.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>To process transactions and deliver your purchased products.</li>
          <li>To improve our website functionality and customer service.</li>
          <li>To send periodic emails regarding your order or other products and services.</li>
          <li>To detect and prevent potential fraud or security breaches.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">4. Third-Party Privacy Policies</h2>
        <p className="text-muted-foreground">Our Privacy Policy does not apply to other advertisers or websites. We advise you to consult the respective Privacy Policies of any third-party services.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">5. GDPR and CCPA Data Protection Rights</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li><strong>Right to access:</strong> You may request copies of your personal data.</li>
          <li><strong>Right to rectification:</strong> You may request correction of inaccurate information.</li>
          <li><strong>Right to erasure:</strong> You may request deletion of your personal data, under certain conditions.</li>
          <li><strong>Right to restrict processing:</strong> You may request restriction of processing of your personal data.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">6. Contact Us</h2>
        <p className="text-muted-foreground">If you have questions about our Privacy Policy, please contact us through our website.</p>
      </section>

      <p className="text-muted-foreground text-sm pt-4 border-t border-border">© 2026 Aether Tennis. All Rights Reserved.</p>
    </main>
  </div>
);

export default PrivacyPolicy;
