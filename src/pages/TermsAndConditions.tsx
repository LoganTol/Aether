import { Link } from "react-router-dom";

const TermsAndConditions = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 w-full py-4 md:py-8 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex justify-between items-center">
        <Link to="/" className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
          AETHER<span className="text-primary">.</span>
        </Link>
      </div>
    </header>

    <main className="container max-w-3xl py-12 space-y-8">
      <h1 className="text-4xl font-bold">Terms and Conditions</h1>
      <p className="text-muted-foreground text-sm">Last Updated: April 2026</p>
      <p>Welcome to Aether Tennis. These Terms and Conditions ("Terms") govern your use of our website and the purchase of any products from us. By accessing the Site, you agree to be bound by these Terms.</p>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">1. General Conditions</h2>
        <p className="text-muted-foreground">We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information) may be transferred unencrypted and involve transmissions over various networks and changes to conform to technical requirements.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">2. Eligibility</h2>
        <p className="text-muted-foreground">By using this Site, you represent that you are at least the age of majority in your state or province of residence, or that you have given us your consent to allow any of your minor dependents to use this site.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">3. Product Information and Pricing</h2>
        <p className="text-muted-foreground">We make every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your monitor's display of any color will be accurate.</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Prices for our products are subject to change without notice.</li>
          <li>We reserve the right to modify or discontinue the Service without notice.</li>
          <li>We shall not be liable for any modification, price change, suspension or discontinuance of the Service.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">4. Accuracy of Billing and Account Information</h2>
        <p className="text-muted-foreground">We reserve the right to refuse any order you place with us. We may limit or cancel quantities purchased per person, per household, or per order.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">5. Shipping and Delivery</h2>
        <p className="text-muted-foreground">Shipping costs and delivery timelines are estimated and not guaranteed. Aether Tennis is not responsible for delays caused by shipping carriers, customs clearances, or other external factors. Risk of loss passes to you upon delivery to the carrier.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">6. Returns and Refunds Policy</h2>
        <p className="text-muted-foreground">Our return policy lasts 30 days. To be eligible for a return, your item must be unused, in the same condition you received it, and in the original packaging. A receipt or proof of purchase is required.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
        <p className="text-muted-foreground">All content on this site is the property of Aether Tennis or its content suppliers and protected by international copyright laws.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
        <p className="text-muted-foreground">In no case shall Aether Tennis, our directors, officers, employees, affiliates, agents, or contractors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">9. Governing Law</h2>
        <p className="text-muted-foreground">These Terms shall be governed by and construed in accordance with applicable law.</p>
      </section>

      <p className="text-muted-foreground text-sm pt-4 border-t border-border">© 2026 Aether Tennis. All Rights Reserved.</p>
    </main>
  </div>
);

export default TermsAndConditions;
