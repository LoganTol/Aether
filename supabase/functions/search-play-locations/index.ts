import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !url || !anon) return reply({ error: "Sign in to search locations." }, 401);
    const client = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return reply({ error: "Sign in to search locations." }, 401);
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey || !lovableKey) return reply({ error: "Location search is not connected yet." }, 503);
    const body = await req.json();
    if (!/^[0-9a-f-]{36}$/i.test(body.sessionToken ?? "")) return reply({ error: "Invalid search session." }, 400);
    const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apiKey, "Content-Type": "application/json", "X-Goog-FieldMask": "" };
    let path: string;
    let payload: unknown;
    let method = "POST";
    if (body.action === "details") {
      if (typeof body.placeId !== "string" || !/^[a-zA-Z0-9_-]{1,256}$/.test(body.placeId)) return reply({ error: "Invalid place." }, 400);
      path = `/places/v1/places/${body.placeId}?sessionToken=${encodeURIComponent(body.sessionToken)}`;
      headers["X-Goog-FieldMask"] = "id,displayName,formattedAddress";
      method = "GET";
    } else if (body.action === "autocomplete" || body.action === "search") {
      if (typeof body.query !== "string" || body.query.trim().length < 3 || body.query.length > 200) return reply({ error: "Enter a venue, city or address." }, 400);
      const locationBias = typeof body.latitude === "number" && typeof body.longitude === "number" && Number.isFinite(body.latitude) && Number.isFinite(body.longitude) && Math.abs(body.latitude) <= 90 && Math.abs(body.longitude) <= 180
        ? { circle: { center: { latitude: body.latitude, longitude: body.longitude }, radius: 30000 } }
        : { rectangle: { low: { latitude: -90, longitude: -180 }, high: { latitude: 90, longitude: 180 } } };
      if (body.action === "search") {
        path = "/places/v1/places:searchText";
        headers["X-Goog-FieldMask"] = "places.id,places.displayName,places.formattedAddress";
        payload = { textQuery: body.query.trim(), pageSize: 5, locationBias };
      } else {
        path = "/places/v1/places:autocomplete";
        headers["X-Goog-FieldMask"] = "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text";
        payload = { input: body.query.trim(), sessionToken: body.sessionToken, locationBias };
      }
    } else return reply({ error: "Invalid search action." }, 400);
    const response = await fetch(`${GATEWAY_URL}${path}`, { method, headers, ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      const details = await response.text();
      console.error(`Google Places failed [${response.status}]: ${details}`);
      let message = "Location search could not be completed.";
      if (response.status === 403) {
        let reason = "";
        try { reason = JSON.parse(details)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason ?? ""; } catch { /* Preserve provider details below. */ }
        message = reason === "API_KEY_HTTP_REFERRER_BLOCKED" ? "Google Maps server key is referrer-restricted. In Google Cloud Console, set the server key's application restrictions to None or IP addresses."
          : reason === "API_KEY_SERVICE_BLOCKED" ? "Google Maps server key does not allow Places API (New). Add it to the key's allowed APIs in Google Cloud Console."
          : "Google Maps denied location search. Check the server key's restrictions in Google Cloud Console.";
      }
      return reply({ error: message, status: response.status, details }, response.status);
    }
    return reply(await response.json());
  } catch (error) { return reply({ error: error instanceof Error ? error.message : "Location search unavailable." }, 500); }
});