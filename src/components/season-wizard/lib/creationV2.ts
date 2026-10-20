import { z } from "zod";
import { generateRoundRobin } from "@/lib/fixtures";
export interface PreviewPlayer { id: string; display_name: string; invited_email: string | null; status: string; user_id: string | null }
export interface PreviewFixture { round: number; a: string; b: string; aName: string; bName: string }
export function buildPreviewRoster(players: PreviewPlayer[], invites: {id:string;recipient_name:string|null;recipient_email:string|null;status:string;expires_at:string}[], now:number): PreviewPlayer[] {
 const roster=players.filter(p=>p.status==="active"||p.status==="invited");
 const emails=new Set(roster.map(p=>p.invited_email?.toLowerCase()).filter(Boolean));
 for(const invite of invites){
  const email=invite.recipient_email?.toLowerCase();
  if(!email||emails.has(email)||invite.status!=="pending"||Date.parse(invite.expires_at)<=now)continue;
  emails.add(email);roster.push({id:`invite:${invite.id}`,display_name:invite.recipient_name||invite.recipient_email||"Invited player",invited_email:email,status:"invited",user_id:null});
 }
 return roster;
}
export function previewSchedule(format:string,players:PreviewPlayer[],pairs:{name:string;a:string;b:string}[]) {
 let sides=players.map(p=>({id:p.id,name:p.display_name}));
 if(format==="doubles"){
  const ids=pairs.flatMap(p=>[p.a,p.b]);
  if(players.length<4||players.length%2!==0||ids.length!==players.length||new Set(ids).size!==players.length||!players.every(p=>ids.includes(p.id)))return null;
  sides=pairs.map((p,i)=>({id:`team:${i}`,name:p.name.trim()||`Team ${i+1}`}));
 }
 if(sides.length<2||sides.length*(sides.length-1)/2>1000)return null;
 return generateRoundRobin(sides.map(p=>p.id)).flatMap((round,i)=>round.flatMap(([a,b])=>{
  if(!a||!b)return [];
  return [{round:i+1,a,b,aName:sides.find(p=>p.id===a)?.name||"Player",bName:sides.find(p=>p.id===b)?.name||"Player"}];
 }));
}
export interface InvitePlayer { name: string; email: string }
export function validateInvitePlayers(players: InvitePlayer[]): InvitePlayer[] {
 const filled=players.filter(p=>p.name.trim()||p.email.trim());
 const emails=parseInviteEmails(filled.map(p=>p.email).join(","));
 for(const p of filled){
  if(!p.name.trim()||p.name.trim().length>60)throw new Error("Enter a player name (up to 60 characters).");
  if(!z.string().email().max(254).safeParse(p.email.trim()).success)throw new Error("Enter one valid email for each player.");
 }
 if(emails.length!==filled.length)throw new Error("Use a different email for each player.");
 return filled.map(p=>({name:p.name.trim(),email:p.email.trim().toLowerCase()}));
}
export function formatSeasonDate(value: string): string {
 const [year,month,day]=value.split("-");
 return `${month}/${day}/${year}`;
}
export function parseInviteEmails(value: string): string[] {
 const emails=[...new Set(value.split(/[\s,;]+/).map(e=>e.trim().toLowerCase()).filter(Boolean))];
 if(emails.length>50) throw new Error("Prepare at most 50 invitations at a time.");
 for(const email of emails) if(!z.string().email().max(254).safeParse(email).success) throw new Error(`Invalid email address: ${email}`);
 return emails;
}
export function validateBasics(d: {name:string;format:string;start:string;end:string}): string|null {
 if(!d.name.trim() || d.name.trim().length>80) return "Enter a season name (up to 80 characters).";
 if(!["singles","doubles"].includes(d.format))return "Choose singles or doubles.";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.start)||!/^\d{4}-\d{2}-\d{2}$/.test(d.end)||!Number.isFinite(Date.parse(d.start))||!Number.isFinite(Date.parse(d.end)))return "Choose valid season dates.";
 if(d.end<=d.start)return "End date must be after start date.";
 return null;
}
export function rosterReady(format:string,players:{id:string;status:string;user_id:string|null}[],teams:{player_a_id:string;player_b_id:string}[]):boolean {
 const active=players.filter(p=>p.status==="active"&&p.user_id);if(format==="singles")return active.length>=2;
 const ids=teams.flatMap(t=>[t.player_a_id,t.player_b_id]);
 return active.length>=4&&active.length%2===0&&ids.length===active.length&&new Set(ids).size===active.length&&active.every(p=>ids.includes(p.id));
}
