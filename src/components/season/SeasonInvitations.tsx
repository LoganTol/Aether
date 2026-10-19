import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { parseInviteEmails } from "@/components/season-wizard/lib/creationV2";
type Invite = { id: string; token: string; recipient_email: string | null; status: string; expires_at: string };
export default function SeasonInvitations({ seasonId, onChange }: { seasonId: string; onChange?: () => void }) {
 const [invites,setInvites]=useState<Invite[]>([]); const [emails,setEmails]=useState(""); const [busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{const {data,error}=await supabase.from("season_invites").select("id,token,recipient_email,status,expires_at").eq("season_id",seasonId).order("created_at");if(error)toast({title:error.message,variant:"destructive"});else setInvites(data||[]);},[seasonId]);
 useEffect(()=>{refresh();},[refresh]);
 const copy=async(token:string)=>{try{await navigator.clipboard.writeText(`${window.location.origin}/join/${token}`);toast({title:"Invitation copied"});}catch{toast({title:"Could not copy",variant:"destructive"});}};
 const shared=invites.find(i=>!i.recipient_email&&i.status==="pending"&&new Date(i.expires_at)>new Date());
 const share=async()=>{if(shared){await copy(shared.token);return;}const {data,error}=await supabase.rpc("manage_season_invite_v2",{_season:seasonId});if(error)toast({title:error.message,variant:"destructive"});else if(data){await copy(data);refresh();}};
 const prepare=async()=>{if(busy)return;setBusy(true);try{const list=parseInviteEmails(emails);if(!list.length)throw new Error("Enter at least one email.");for(const email of list){const {error}=await supabase.rpc("manage_season_invite_v2",{_season:seasonId,_email:email});if(error)throw error;}setEmails("");toast({title:"Invitations prepared",description:"Copy personal links below. Email sending awaits sender-domain setup."});await refresh();onChange?.();}catch(e){toast({title:(e as {message:string}).message,variant:"destructive"});}finally{setBusy(false);}};
 const revoke=async(id:string)=>{const {error}=await supabase.rpc("manage_season_invite_v2",{_season:seasonId,_revoke:id});if(error)toast({title:error.message,variant:"destructive"});else refresh();};
 return <section className="space-y-4 border-b border-border pb-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-ui-title">Invite players</h2><Button variant="outline" onClick={share}><Copy/>Copy season link</Button></div>
  <label className="block text-sm" htmlFor="season-invites">Email invitations</label><textarea id="season-invites" rows={2} className="field" value={emails} onChange={e=>setEmails(e.target.value)} placeholder="alex@example.com, sam@example.com" maxLength={13000}/>
  <Button onClick={prepare} disabled={busy}>{busy&&<Loader2 className="animate-spin"/>}Prepare invitations</Button>
  <p className="text-meta">Personal invitation links expire after 30 days. Email delivery awaits sender setup.</p>
  <ul className="divide-y divide-border">{invites.map(i=>{const state=i.status==="pending"&&new Date(i.expires_at)<=new Date()?"expired":i.status;return <li key={i.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="break-all text-sm">{i.recipient_email||"Shared season link"}</p><p className="text-meta capitalize">{state}</p></div>{state==="pending"&&<div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" aria-label={`Copy invitation for ${i.recipient_email||"season"}`} onClick={()=>copy(i.token)}><Copy/></Button><Button variant="ghost" size="icon" aria-label="Revoke invitation" onClick={()=>revoke(i.id)}><Trash2/></Button></div>}</li>;})}</ul>
 </section>;
}