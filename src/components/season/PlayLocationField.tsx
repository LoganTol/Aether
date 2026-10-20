import { useEffect, useId, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { venueAddress } from "@/lib/match-scheduling";

type Place = { id: string; name: string; address?: string };
type SearchResponse = { suggestions?: { placePrediction?: { placeId: string; text: { text: string } } }[]; places?: { id: string; displayName?: { text: string }; formattedAddress?: string }[]; displayName?: { text: string }; formattedAddress?: string };

export default function PlayLocationField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>();
  const [active, setActive] = useState(-1);
  const session = useRef(crypto.randomUUID());
  const version = useRef(0);
  const cache = useRef(new Map<string, Place[]>());
  const invoke = async (body: Record<string, unknown>): Promise<SearchResponse> => {
    const { data, error: failure } = await supabase.functions.invoke("search-play-locations", { body: { ...body, sessionToken: session.current, ...coordinates } });
    if (failure) {
      let message = failure.message;
      if (failure instanceof FunctionsHttpError) {
        try { const details = await failure.context.json(); message = details.error ?? message; } catch { /* Keep original message. */ }
      }
      throw new Error(message);
    }
    return data;
  };
  useEffect(() => {
    if (!focused || !typed || value.trim().length < 3) { setBusy(false); setPlaces([]); return; }
    const current = ++version.current;
    const key = `${value}:${coordinates?.latitude}:${coordinates?.longitude}`;
    const cached = cache.current.get(key);
    if (cached) { setPlaces(cached); return; }
    const timer = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const result = await invoke({ action: "autocomplete", query: value });
        if (current !== version.current) return;
        const next = (result.suggestions ?? []).flatMap(s => s.placePrediction ? [{ id: s.placePrediction.placeId, name: s.placePrediction.text.text }] : []).slice(0, 5);
        cache.current.set(key, next); setPlaces(next); setActive(-1);
      } catch (e) { if (current === version.current) { setError(e instanceof Error ? e.message : "Address search unavailable."); setPlaces([]); } }
      finally { if (current === version.current) setBusy(false); }
    }, 350);
    return () => clearTimeout(timer);
  // invoke reads the search session and current coordinates; they are managed within this control.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, typed, coordinates]);
  const select = async (place: Place) => {
    const current = ++version.current;
    setBusy(true); setError(""); setTyped(false); setPlaces([]);
    try {
      const details = place.address ? { displayName: { text: place.name }, formattedAddress: place.address } : await invoke({ action: "details", placeId: place.id });
      if (current !== version.current) return;
      if (!details.formattedAddress) throw new Error("This place has no full address. Choose another location.");
      const location = venueAddress(details.displayName?.text ?? place.name, details.formattedAddress);
      if (location.length > 200) throw new Error("This address is too long. Enter a shorter venue name with its full address.");
      onChange(location); setVerified(true); setFocused(false);
      session.current = crypto.randomUUID(); cache.current.clear();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load this address."); }
    finally { setBusy(false); }
  };
  const search = async () => {
    const current = ++version.current;
    setTyped(false); setBusy(true); setError(""); setFocused(true);
    try {
      const data = await invoke({ action: "search", query: value });
      if (current !== version.current) return;
      setPlaces((data.places ?? []).map(p => ({ id: p.id, name: p.displayName?.text ?? "Location", address: p.formattedAddress }))); setActive(-1);
    } catch (e) { if (current === version.current) setError(e instanceof Error ? e.message : "Address search unavailable."); }
    finally { if (current === version.current) setBusy(false); }
  };
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-2"><label htmlFor={id} className="flex items-center gap-2 text-sm font-medium"><MapPin size={15} className="text-primary"/>Location</label><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Search Near Me" title="Search Near Me" onClick={() => {
      if (!navigator.geolocation) { setError("Location access is unavailable. Include a city in your search."); return; }
      navigator.geolocation.getCurrentPosition(position => { setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setError(""); setTyped(true); }, () => setError("Location access was declined. Include a city in your search."), { timeout: 10000 });
    }}><LocateFixed size={15}/></Button></div>
    <div className="relative">
      <Input id={id} role="combobox" aria-autocomplete="list" aria-expanded={focused && places.length > 0} aria-controls={`${id}-places`} aria-activedescendant={active >= 0 ? `${id}-place-${active}` : undefined} placeholder="Search Court, Venue Or Address" value={value} maxLength={200} className="h-11 pr-20" onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onChange={e => { ++version.current; onChange(e.target.value); setTyped(true); setVerified(false); setError(""); setActive(-1); }} onKeyDown={e => {
        if (e.key === "ArrowDown" && places.length) { e.preventDefault(); setActive(a => (a + 1) % places.length); }
        if (e.key === "ArrowUp" && places.length) { e.preventDefault(); setActive(a => (a - 1 + places.length) % places.length); }
        if (e.key === "Escape") { setFocused(false); ++version.current; }
        if (e.key === "Enter") { e.preventDefault(); const place = places[active]; if (place) void select(place); else if (value.trim().length >= 3) void search(); }
      }}/>
      <div className="absolute right-1 top-1 flex items-center">{value && <Button variant="ghost" size="icon" className="h-9 w-8" aria-label="Clear Location" title="Clear Location" onClick={() => { ++version.current; onChange(""); setPlaces([]); setTyped(false); setVerified(false); }}><X size={14}/></Button>}<Button variant="ghost" size="icon" className="h-9 w-8" disabled={busy || value.trim().length < 3} aria-label="Search Locations" title="Search Locations" onClick={() => void search()}>{busy ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}</Button></div>
      {focused && places.length > 0 && <div id={`${id}-places`} role="listbox" aria-label="Locations" className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
        {places.map((place, i) => <Button key={place.id} id={`${id}-place-${i}`} role="option" aria-selected={active === i} variant="ghost" className={`h-auto w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left ${active === i ? "bg-accent" : ""}`} onMouseDown={e => e.preventDefault()} onClick={() => void select(place)}><MapPin size={15} className="shrink-0 text-primary"/><span className="min-w-0 break-words"><span className="block text-sm font-medium normal-case">{place.name}</span>{place.address && <span className="mt-1 block text-xs font-normal text-muted-foreground normal-case">{place.address}</span>}</span></Button>)}
        <div className="border-t border-border px-3 py-2 text-right text-xs text-muted-foreground">Google Maps</div>
      </div>}
    </div>
    {verified && <p className="flex items-center gap-1.5 text-xs text-primary"><CheckCircle2 size={13}/>Full Address Selected</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error} You can still enter the full address manually.</p>}
    {!error && focused && typed && value.length >= 3 && !busy && places.length === 0 && <p className="text-xs text-muted-foreground">No suggestions. Search by venue and city, or enter the full address.</p>}
  </div>;
}