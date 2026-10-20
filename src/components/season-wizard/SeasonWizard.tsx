import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { parseInviteEmails, validateBasics, validateInvitePlayers, formatSeasonDate, type InvitePlayer } from "./lib/creationV2";

interface Draft { key: string; id?: string; token?: string; name: string; format: "singles" | "doubles"; start: string; end: string; players: InvitePlayer[]; step: number }
const freshDraft = (): Draft => ({ key: crypto.randomUUID(), name: "", format: "singles", start: new Date().toISOString().slice(0,10), end: new Date(Date.now()+56*86400000).toISOString().slice(0,10), players: [{name:"",email:""}], step: 1 });
const storedDraft = z.object({key:z.string().uuid(),id:z.string().uuid().optional(),token:z.string().optional(),name:z.string(),format:z.enum(["singles","doubles"]),start:z.string(),end:z.string(),emails:z.string().optional(),players:z.array(z.object({name:z.string(),email:z.string()})).optional(),step:z.number().min(1).max(3)}).transform(({emails,players,...draft})=>({...draft,players:players??(emails?parseInviteEmails(emails).map(email=>({name:"",email})):[{name:"",email:""}])}));
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
  let players:InvitePlayer[]; try{players=validateInvitePlayers(draft.players);}catch(e){toast({title:e instanceof Error?e.message:"Invalid invitations",variant:"destructive"});return;}
  locked.current=true;setBusy(true);
  try {
   const {data,error}=await supabase.rpc("save_named_season_draft_v2",{_key:draft.key,_name:draft.name,_format:draft.format,_start:draft.start,_end:draft.end,_players:players.map(p=>({name:p.name,email:p.email}))});
   if(error)throw error;
   const result=data as {id:string;token:string};
   if(finish){ localStorage.removeItem(storageKey); navigate(`/app/seasons/${result.id}`); }
   else patch({id:result.id,token:result.token,step:draft.step+1});
  }catch(e){toast({title:"Could not save season",description:e instanceof Error?e.message:(e as {message?:string}).message,variant:"destructive"});}
  finally{locked.current=false;setBusy(false);}
 };
 const copy=async()=>{if(!draft.token)return;try{await navigator.clipboard.writeText(`${window.location.origin}/join/${draft.token}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{toast({title:"Could not copy invite",variant:"destructive"});}};
 const count=draft.players.filter(p=>p.email.trim()).length;
 const updatePlayer=(index:number,field:keyof InvitePlayer,value:string)=>patch({players:draft.players.map((p,i)=>i===index?{...p,[field]:value}:p)});
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
   <div className="space-y-4"><h2 className="text-sm font-medium">Email invitations (optional)</h2>{draft.players.map((player,i)=><div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"><div className="min-w-0"><label htmlFor={`player-name-${i}`} className="mb-2 block text-sm font-medium">Player name</label><input id={`player-name-${i}`} className="field" placeholder="Player name" value={player.name} maxLength={60} onChange={e=>updatePlayer(i,"name",e.target.value)}/></div><div className="min-w-0"><label htmlFor={`player-email-${i}`} className="mb-2 block text-sm font-medium">Email</label><input id={`player-email-${i}`} type="email" className="field" placeholder="alex@example.com" value={player.email} maxLength={254} onChange={e=>updatePlayer(i,"email",e.target.value)}/></div><Button variant="ghost" size="icon" aria-label={`Remove player ${i+1}`} onClick={()=>patch({players:draft.players.filter((_,j)=>j!==i)})}><Trash2/></Button></div>)}<Button variant="outline" onClick={()=>patch({players:[...draft.players,{name:"",email:""}]})}><Plus/>Add player</Button><p className="text-meta">Invitations are prepared with personal links; email delivery awaits sender setup.</p></div>
   <div className="flex justify-between border-t border-border pt-4 text-sm"><span>Confirmed participants</span><span className="font-semibold">1 · You</span></div>
   <div className="flex justify-between text-sm"><span>Prepared invitations</span><span className="font-semibold">{count}</span></div>
  </div>}
   {draft.step===3 && <dl className="divide-y divide-border">{[["Season",draft.name],["Format",draft.format],["Dates",`${draft.start} – ${draft.end}`],["Prepared invitations",String(count)],["Scheduling","Player-led"],["Competition","Round robin"],["Initial status","Draft"]].map(([label,value])=><div key={label} className="flex justify-between gap-5 py-4 text-sm"><dt className="shrink-0 text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium capitalize">{label==="Dates"?<><span className="block">Start: {formatSeasonDate(draft.start)}</span><span className="mt-1 block">End: {formatSeasonDate(draft.end)}</span></>:value}</dd></div>)}</dl>}
  <div className="flex justify-between gap-3 border-t border-border pt-5"><Button variant="ghost" disabled={busy} onClick={()=>draft.step>1?patch({step:draft.step-1}):navigate("/app")}>{draft.step===1?"Cancel":"Back"}</Button><Button disabled={busy} onClick={()=>save(draft.step===3)}>{busy&&<Loader2 className="animate-spin"/>}{draft.step===3?"Create Season":draft.step===2&&count===0?"Continue without invites":"Continue"}</Button></div>
 </div>;
}
