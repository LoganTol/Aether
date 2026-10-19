import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
type Settings=Database["public"]["Tables"]["season_settings"]["Row"];
export default function SeasonSettings({seasonId,locked,onChange}:{seasonId:string;locked:boolean;onChange:()=>void}){
 const [settings,setSettings]=useState<Settings|null>(null);const [busy,setBusy]=useState(false);
 useEffect(()=>{supabase.from("season_settings").select("*").eq("season_id",seasonId).single().then(({data,error})=>{if(error)toast({title:error.message,variant:"destructive"});else setSettings(data);});},[seasonId]);
 if(!settings)return <p className="text-meta">Loading settings…</p>;
 const patch=(value:Partial<Settings>)=>setSettings(s=>s?{...s,...value}:s);
 const save=async()=>{setBusy(true);const {error}=await supabase.rpc("save_season_settings_v2",{_season:seasonId,_settings:{...settings,scheduling_mode:settings.scheduling_mode||"rotating_captain"}});setBusy(false);if(error)toast({title:error.message,variant:"destructive"});else{toast({title:"Settings saved"});onChange();}};
 return <section className="max-w-2xl space-y-6"><h2 className="text-section-title">Season settings</h2>{locked&&<p className="text-body">Scheduling mode, scoring, deadlines, result confirmation, and rotation order are locked because fixtures already exist.</p>}
 <div className="grid gap-5 sm:grid-cols-2">
 <div><label htmlFor="scheduling-mode" className="mb-2 block text-sm">Scheduling mode</label><select id="scheduling-mode" className="field" disabled={locked} value={settings.scheduling_mode||"rotating_captain"} onChange={e=>patch({scheduling_mode:e.target.value})}><option value="player_led">Player-led</option><option value="rotating_captain">Rotating Captain</option><option value="organizer_managed">Organizer-managed</option></select></div>
 <div><label htmlFor="scoring-rules" className="mb-2 block text-sm">Scoring rules</label><select id="scoring-rules" className="field" disabled={locked} value={settings.score_format} onChange={e=>patch({score_format:e.target.value as Settings["score_format"]})}><option value="best_of_3">Best of 3 sets</option><option value="single_set_6">Single set to 6</option><option value="pro_set_8">Pro set to 8</option></select></div>
 <div><label htmlFor="deadline-days" className="mb-2 block text-sm">Match deadline (days)</label><input id="deadline-days" className="field" type="number" min={1} max={60} disabled={locked} value={settings.match_deadline_days} onChange={e=>patch({match_deadline_days:Number(e.target.value)})}/></div>
 <div><label htmlFor="captain-days" className="mb-2 block text-sm">Captain window (days)</label><input id="captain-days" className="field" type="number" min={1} max={30} value={settings.captain_window_days} onChange={e=>patch({captain_window_days:Number(e.target.value)})}/></div>
 <div><label htmlFor="captain-order" className="mb-2 block text-sm">Captain rotation</label><select id="captain-order" className="field" disabled={locked} value={settings.captain_rotation_mode} onChange={e=>patch({captain_rotation_mode:e.target.value as Settings["captain_rotation_mode"]})}><option value="invite_order">Join order</option><option value="alphabetical">Alphabetical</option><option value="random">Random</option>{settings.captain_rotation_mode==="manual"&&<option value="manual">Existing manual order</option>}</select></div>
 <div><label className="mb-2 block text-sm">Dispute handling</label><select className="field" value={settings.dispute_resolution} disabled><option value="creator_decides">Organizer review</option><option value="majority_vote">Legacy majority vote</option></select></div>
 <div><label className="mb-2 block text-sm">Forfeit handling</label><select className="field" value={settings.forfeit_handling} disabled><option value="manual_review">Organizer review</option><option value="auto_loss">Legacy auto-loss</option></select></div>
 </div>
 <div className="space-y-3 border-t border-border pt-5">{[{key:"result_confirmation" as const,label:"Opposing side confirms results",disabled:locked},{key:"captain_reminders" as const,label:"Captain reminders",disabled:false},{key:"deadline_reminders" as const,label:"Deadline reminders",disabled:false}].map(({key,label,disabled})=><label key={key} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><input type="checkbox" checked={settings[key]} disabled={disabled} onChange={e=>patch({[key]:e.target.checked})}/></label>)}</div>
 <p className="text-meta">Reminder preferences are saved; email delivery awaits sender setup. Disputes and forfeits currently require organizer review.</p>
 <div className="border-t border-border pt-5"><h3 className="text-ui-title">Standings tie-breakers</h3><p className="text-body mt-2">Wins → Set difference → Game difference. Remaining ties stay shared; head-to-head customization is not enabled.</p></div>
 <Button disabled={busy} onClick={save}>Save settings</Button></section>;
}