import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { parseInviteEmails, validateBasics } from "./lib/creationV2";

interface Draft { key: string; id?: string; token?: string; name: string; format: "singles" | "doubles"; start: string; end: string; emails: string; step: number }
const freshDraft = (): Draft => ({ key: crypto.randomUUID(), name: "", format: "singles", start: new Date().toISOString().slice(0,10), end: new Date(Date.now()+56*86400000).toISOString().slice(0,10), emails: "", step: 1 });
const storedDraft = z.object({key:z.string().uuid(),id:z.string().uuid().optional(),token:z.string().optional(),name:z.string(),format:z.enum(["singles","doubles"]),start:z.string(),end:z.string(),emails:z.string(),step:z.number().min(1).max(3)});
export default function SeasonWizard() {
 const { user } = useAuth(); const navigate = useNavigate();
 const storageKey = `aether-season-setup-${user?.id}`;
 const [draft,setDraft] = useState<Draft>(() => { try { const parsed=storedDraft.safeParse(JSON.parse(localStorage.getItem(storageKey)||"null")); return parsed.success ? parsed.data : freshDraft(); } catch { return freshDraft(); } });
 const [busy,setBusy]=useState(false); const locked=useRef(false); const [copied,setCopied]=useState(false);
 const patch=(v:Partial<Draft>)=>setDraft(d=>({...d,...v}));
 useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(draft));},[draft,storageKey]);
 const save=async (finish=false)=>{
  if(locked.current) return;
  const error=validateBasics(draft); if(error){toast({title:error,variant:"destructive"});return;}
  let emails:string[]; try{emails=parseInviteEmails(draft.emails);}catch(e){toast({title:e instanceof Error?e.message:"Invalid emails",variant:"destructive"});return;}
  locked.current=true;setBusy(true);
  try {
   const {data,error}=await supabase.rpc("save_season_draft_v2",{_key:draft.key,_name:draft.name,_format:draft.format,_start:draft.start,_end:draft.end,_emails:emails});
   if(error)throw error;
   const result=data as {id:string;token:string};
   if(finish){ localStorage.removeItem(storageKey); navigate(`/app/seasons/${result.id}`); }
   else patch({id:result.id,token:result.token,step:draft.step+1});
  }catch(e){toast({title:"Could not save season",description:e instanceof Error?e.message:(e as {message?:string}).message,variant:"destructive"});}
  finally{locked.current=false;setBusy(false);}
 };
 const copy=async()=>{if(!draft.token)return;try{await navigator.clipboard.writeText(`${window.location.origin}/join/${draft.token}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{toast({title:"Could not copy invite",variant:"destructive"});}};
 let count=0;try{count=parseInviteEmails(draft.emails).length;}catch{ /* validation occurs on continue */ }
 return <div className="space-y-8 pb-8">
  <ol className="flex items-center gap-4 border-b border-border pb-5 text-sm" aria-label="Season setup progress">{["Basics","Invite players","Review"].map((label,i)=><li key={label} className={`flex min-w-0 flex-1 items-center gap-2 ${draft.step===i+1?"font-semibold text-foreground":"text-muted-foreground"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${draft.step>=i+1?"bg-primary/10 text-primary":"bg-muted"}`}>{i+1}</span><span>{label}</span></li>)}</ol>
  <div><p className="text-meta mb-2">Step {draft.step} of 3</p><h1 className="text-page-title">{draft.step===1?"Season basics":draft.step===2?"Invite your players":"Review & create"}</h1></div>
  {draft.step===1 && <div className="space-y-6">
   <div><label htmlFor="season-name" className="mb-2 block text-sm font-medium">Season name</label><input id="season-name" className="field" value={draft.name} onChange={e=>patch({name:e.target.value})} placeholder="Spring Neighborhood Tennis" maxLength={80}/></div>
   <fieldset><legend className="mb-2 text-sm font-medium">Match format</legend><div className="inline-flex gap-1 rounded-lg border border-border p-1">{(["singles","doubles"] as const).map(f=><Button key={f} variant={draft.format===f?"default":"ghost"} aria-pressed={draft.format===f} onClick={()=>patch({format:f})} className="capitalize">{f}</Button>)}</div></fieldset>
   <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="season-start" className="mb-2 block text-sm font-medium">Start date</label><input id="season-start" type="date" className="field" value={draft.start} onChange={e=>patch({start:e.target.value})}/></div><div><label htmlFor="season-end" className="mb-2 block text-sm font-medium">End date</label><input id="season-end" type="date" className="field" value={draft.end} onChange={e=>patch({end:e.target.value})}/></div></div>
  </div>}
  {draft.step===2 && <div className="space-y-6">
   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><span className="text-sm font-medium">Season invitation link</span><Button variant="outline" onClick={copy} disabled={!draft.token}>{copied?<Check/>:<Copy/>}{copied?"Copied":"Copy invite link"}</Button></div>
   <div><label htmlFor="invite-emails" className="mb-2 block text-sm font-medium">Email invitations (optional)</label><textarea id="invite-emails" rows={4} maxLength={13000} className="field" placeholder="alex@example.com, sam@example.com" value={draft.emails} onChange={e=>patch({emails:e.target.value})}/><p className="text-meta mt-2">Separate addresses with commas or new lines. Invitations are prepared with personal links; email delivery awaits sender setup.</p></div>
   <div className="flex justify-between border-t border-border pt-4 text-sm"><span>Confirmed participants</span><span className="font-semibold">1 · You</span></div>
   <div className="flex justify-between text-sm"><span>Prepared invitations</span><span className="font-semibold">{count}</span></div>
  </div>}
  {draft.step===3 && <dl className="divide-y divide-border">{[["Season",draft.name],["Format",draft.format],["Dates",`${draft.start} – ${draft.end}`],["Prepared invitations",String(count)],["Scheduling","Player-led"],["Competition","Round robin"],["Initial status","Draft"]].map(([label,value])=><div key={label} className="flex justify-between gap-5 py-4 text-sm"><dt className="shrink-0 text-muted-foreground">{label}</dt><dd className="break-words text-right font-medium capitalize">{value}</dd></div>)}</dl>}
  <div className="flex justify-between gap-3 border-t border-border pt-5"><Button variant="ghost" disabled={busy} onClick={()=>draft.step>1?patch({step:draft.step-1}):navigate("/app")}>{draft.step===1?"Cancel":"Back"}</Button><Button disabled={busy} onClick={()=>save(draft.step===3)}>{busy&&<Loader2 className="animate-spin"/>}{draft.step===3?"Create Season":draft.step===2&&count===0?"Continue without invites":"Continue"}</Button></div>
 </div>;
}
