import { z } from "zod";
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
