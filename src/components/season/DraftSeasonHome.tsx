import { useState, useEffect, useCallback } from "react";
import { Check, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Season, Participant, Team } from "./types";
import { rosterReady, buildPreviewRoster, previewSchedule } from "@/components/season-wizard/lib/creationV2";
import SeasonInvitations from "./SeasonInvitations";
import { useAuth } from "@/contexts/AuthContext";
type Fixture={round:number;a:string;b:string;aName?:string;bName?:string};
export default function DraftSeasonHome({season,participants,teams,isCreator,onChange}:{season:Season;participants:Participant[];teams:Team[];isCreator:boolean;onChange:()=>void}){
 const {user}=useAuth();
 const [preview,setPreview]=useState<Fixture[]|null>(null);const [busy,setBusy]=useState(false);
 const [pairs,setPairs]=useState(()=>teams.map(t=>({name:t.name,a:t.player_a_id,b:t.player_b_id})));
 const [invites,setInvites]=useState<{id:string;recipient_name:string|null;recipient_email:string|null;status:string;expires_at:string}[]>([]);
 const loadInvites=useCallback(async()=>{if(!isCreator)return;const {data,error}=await supabase.from("season_invites").select("id,recipient_name,recipient_email,status,expires_at").eq("season_id",season.id);if(error)toast({title:"Could not load roster invitations",description:error.message,variant:"destructive"});else setInvites(data||[]);},[season.id,isCreator]);
 useEffect(()=>{void loadInvites();},[loadInvites]);
 const active=participants.filter(p=>p.status==="active"&&p.user_id);const ready=rosterReady(season.format,participants,teams);
 const planningRoster=buildPreviewRoster(participants.map(p=>({...p,invited_email:p.invited_email||(p.user_id===user?.id?user?.email||null:null)})),invites,Date.now());
 const plannedFixtures=previewSchedule(season.format,planningRoster,pairs);
 const pendingCount=planningRoster.filter(p=>p.status==="invited").length;
 useEffect(()=>{setPreview(null);},[participants,invites,pairs]);
 const label=(id:string)=>season.format==="doubles"?teams.find(t=>t.id===id)?.name:participants.find(p=>p.id===id)?.display_name;
 const run=async(activate:boolean)=>{if(busy)return;if(!activate){setPreview(plannedFixtures);return;}setBusy(true);try{const {data,error}=await supabase.rpc("season_fixtures_v2",{_season:season.id,_activate:true});if(error)throw error;const res=data as {existing:boolean};toast({title:res.existing?"Schedule already exists":"Season activated"});onChange();}catch(e){toast({title:(e as {message:string}).message,variant:"destructive"});}finally{setBusy(false);}};
 const saveTeams=async()=>{setBusy(true);const {error}=await supabase.rpc("save_doubles_teams_v2",{_season:season.id,_teams:pairs});setBusy(false);if(error)toast({title:error.message,variant:"destructive"});else{setPreview(null);toast({title:"Teams saved"});onChange();}};
 const count=plannedFixtures?.length||0;const duration=Math.ceil((Date.parse(season.end_date)-Date.parse(season.start_date))/604800000);
 return <div className="space-y-7">
  <section className="border-b border-border pb-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><h2 className="text-section-title">Your season starts here</h2><span className="text-meta">{active.length} confirmed · {pendingCount} pending roster invitations</span></div>
  <ol className="grid gap-4 sm:grid-cols-2">{[{label:"Season created",done:true},{label:"Invite players",done:planningRoster.length>1},{label:"Finalize roster",done:!!preview},{label:"Generate schedule",done:false}].map((item,i)=><li key={item.label} className="flex items-center gap-3 text-sm">{item.done?<Check className="text-primary" size={18}/>:<Circle className="text-muted-foreground" size={18}/>}<span>{i+1}. {item.label}</span></li>)}</ol></section>
  {isCreator?<SeasonInvitations seasonId={season.id} onChange={onChange}/>:<p className="text-body">The organizer is preparing the roster. Competition begins once the schedule is generated.</p>}
  <section><h2 className="text-ui-title mb-3">Confirmed roster</h2><ul className="divide-y divide-border">{active.map(p=><li key={p.id} className="flex justify-between gap-3 py-3 text-sm"><span>{p.display_name}</span><span className="text-primary">Confirmed</span></li>)}</ul></section>
  {isCreator&&season.format==="doubles"&&<section className="space-y-4 border-t border-border pt-5"><h2 className="text-ui-title">Fixed doubles teams</h2>{pairs.map((pair,i)=><div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"><input className="field" aria-label={`Team ${i+1} name`} value={pair.name} onChange={e=>setPairs(arr=>arr.map((t,j)=>j===i?{...t,name:e.target.value}:t))}/>{(["a","b"] as const).map(side=><select key={side} className="field" aria-label={`Team ${i+1} partner ${side}`} value={pair[side]} onChange={e=>setPairs(arr=>arr.map((t,j)=>j===i?{...t,[side]:e.target.value}:t))}><option value="">Select player</option>{planningRoster.map(p=><option key={p.id} value={p.id}>{p.display_name}{p.status==="invited"?" (invited)":""}</option>)}</select>)}<Button variant="ghost" size="icon" aria-label="Remove team" onClick={()=>setPairs(arr=>arr.filter((_,j)=>j!==i))}><Trash2/></Button></div>)}<div className="flex gap-2"><Button variant="outline" onClick={()=>setPairs(arr=>[...arr,{name:`Team ${arr.length+1}`,a:"",b:""}])}><Plus/>Add team</Button><Button disabled={busy||pendingCount>0||!plannedFixtures} onClick={saveTeams}>Save teams</Button></div></section>}
  <section className="space-y-4 border-t border-border pt-5"><h2 className="text-ui-title">Roster readiness</h2><p className="text-body">{plannedFixtures?`${count} round-robin matches · ${duration} weeks`:(season.format==="doubles"?"At least four players, an even roster, and complete fixed teams are required to preview.":"Add at least two players to preview. Invited players are included.")}</p>
  {plannedFixtures&&count>duration*3&&<p role="alert" className="text-sm text-destructive">This season has {count} matches across {duration} weeks. Consider extending the dates before activation.</p>}
  {isCreator&&<Button variant="outline" disabled={!plannedFixtures||busy} onClick={()=>run(false)}>{busy&&<Loader2 className="animate-spin"/>}Finalize roster & preview schedule</Button>}
  {preview&&<div className="space-y-4"><h3 className="text-ui-title">Schedule preview · {preview.length} matches</h3><ul className="max-h-72 divide-y divide-border overflow-y-auto">{preview.map((p,i)=><li key={i} className="py-2 text-sm">Round {p.round} · {p.aName||label(p.a)} vs {p.bName||label(p.b)}</li>)}</ul><p className="text-meta">{ready?"Generating locks the roster and competition rules. Outstanding invitations will stop accepting new players.":"Invited players are included in this preview. Players must accept their invitations before the season can be activated."}</p><Button disabled={busy||!ready||pendingCount>0} onClick={()=>run(true)}>{busy&&<Loader2 className="animate-spin"/>}Generate schedule & activate</Button></div>}
  </section>
 </div>;
}