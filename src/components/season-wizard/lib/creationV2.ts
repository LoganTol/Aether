import { z } from "zod";
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
