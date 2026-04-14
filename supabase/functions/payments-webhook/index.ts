import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id, "mode:", session.mode);

        const lineItem = session.line_items?.data?.[0];
        const productName = lineItem?.description || "Solo Tennis Trainer";

        const { error: insertError } = await supabase.from("orders").insert({
          customer_email: session.customer_details?.email || session.customer_email,
          amount_total: session.amount_total,
          currency: session.currency || "usd",
          stripe_session_id: session.id,
          stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          product_name: productName,
          status: "completed",
          environment: env,
        });

        if (insertError) {
          console.error("Failed to insert order:", insertError);
        } else {
          console.log("Order recorded for:", session.customer_details?.email || session.customer_email);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        console.log("Subscription event:", event.type, event.data.object.id);
        break;
      case "invoice.payment_failed":
        console.log("Payment failed:", event.data.object.id);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
