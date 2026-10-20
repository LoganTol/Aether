import { describe, expect, it } from "vitest";
import { parseInviteEmails, rosterReady, validateBasics, validateInvitePlayers, buildPreviewRoster, previewSchedule } from "@/components/season-wizard/lib/creationV2";
import { generateRoundRobin } from "@/lib/fixtures";
describe("Season Creation V2 rules",()=>{
 it("previews one singles match before an invited player accepts",()=>{
  const roster=buildPreviewRoster([{id:"organizer",display_name:"Organizer",status:"active",user_id:"u1",invited_email:null}],[{id:"i1",recipient_name:"Alex Morgan",recipient_email:"alex@example.com",status:"pending",expires_at:"2026-11-20T00:00:00Z"}],Date.parse("2026-10-20T00:00:00Z"));
  expect(previewSchedule("singles",roster,[])).toEqual([{round:1,a:"organizer",b:"invite:i1",aName:"Organizer",bName:"Alex Morgan"}]);
  expect(rosterReady("singles",roster,[])).toBe(false);
 });
 it("excludes expired and revoked invitations from previews",()=>{
  const invites=[{id:"expired",recipient_name:"Alex",recipient_email:"alex@example.com",status:"pending",expires_at:"2026-10-19T00:00:00Z"},{id:"revoked",recipient_name:"Sam",recipient_email:"sam@example.com",status:"revoked",expires_at:"2026-11-20T00:00:00Z"}];
  expect(buildPreviewRoster([],invites,Date.parse("2026-10-20T00:00:00Z"))).toEqual([]);
 });
 it("does not duplicate invited players already on the roster",()=>{
  const players=[{id:"p1",display_name:"Alex",status:"active",user_id:"u1",invited_email:"alex@example.com"}];
  expect(buildPreviewRoster(players,[{id:"i1",recipient_name:"Alex",recipient_email:"ALEX@example.com",status:"pending",expires_at:"2026-11-20T00:00:00Z"}],Date.parse("2026-10-20T00:00:00Z"))).toHaveLength(1);
 });
 it("previews fixed doubles teams with unconfirmed invited players",()=>{
  const players=["a","b","c","d"].map(id=>({id,display_name:id,status:"invited",user_id:null,invited_email:null}));
  expect(previewSchedule("doubles",players,[{name:"Team 1",a:"a",b:"b"},{name:"Team 2",a:"c",b:"d"}])).toEqual([{round:1,a:"team:0",b:"team:1",aName:"Team 1",bName:"Team 2"}]);
  expect(rosterReady("doubles",players,[])).toBe(false);
 });
 it("preserves names and emails for each invited player",()=>expect(validateInvitePlayers([{name:" Alex Smith ",email:"ALEX@example.com"},{name:"Sam",email:"sam@example.com"}])).toEqual([{name:"Alex Smith",email:"alex@example.com"},{name:"Sam",email:"sam@example.com"}]));
 it("keeps first and last names intact for overview invitations",()=>expect(validateInvitePlayers([{name:"Alex Morgan",email:"alex@example.com"},{name:"Sam Taylor",email:"sam@example.com"}]).map(p=>p.name)).toEqual(["Alex Morgan","Sam Taylor"]));
 it("requires a name for an entered invitation",()=>expect(()=>validateInvitePlayers([{name:"",email:"alex@example.com"}])).toThrow());
 it("requires an email for an entered player",()=>expect(()=>validateInvitePlayers([{name:"Alex",email:""}])).toThrow());
 it("allows blank invitation rows without registering players",()=>expect(validateInvitePlayers([{name:"",email:""}])).toEqual([]));
 it("prevents duplicate player emails",()=>expect(()=>validateInvitePlayers([{name:"Alex",email:"alex@example.com"},{name:"Sam",email:"ALEX@example.com"}])).toThrow());
 it("allows creation with no invitations",()=>expect(parseInviteEmails("")).toEqual([]));
 it("accepts multiple addresses and removes duplicate invitations",()=>expect(parseInviteEmails("alex@example.com, SAM@example.com\nalex@example.com")).toEqual(["alex@example.com","sam@example.com"]));
 it("rejects malformed email invitations",()=>expect(()=>parseInviteEmails("not-an-email")).toThrow());
 it("requires end date after start date",()=>expect(validateBasics({name:"Season",format:"singles",start:"2026-10-20",end:"2026-10-20"})).not.toBeNull());
 it("does not count invited players toward confirmed singles roster",()=>expect(rosterReady("singles",[{id:"a",status:"active",user_id:"1"},{id:"b",status:"invited",user_id:null}],[])).toBe(false));
 it("supports a two-person singles season",()=>expect(rosterReady("singles",[{id:"a",status:"active",user_id:"1"},{id:"b",status:"active",user_id:"2"}],[])).toBe(true));
 it("requires complete fixed doubles teams",()=>expect(rosterReady("doubles",["a","b","c","d"].map(id=>({id,status:"active",user_id:id})),[{player_a_id:"a",player_b_id:"b"}])).toBe(false));
 it("rejects duplicate doubles partners",()=>expect(rosterReady("doubles",["a","b","c","d"].map(id=>({id,status:"active",user_id:id})),[{player_a_id:"a",player_b_id:"b"},{player_a_id:"a",player_b_id:"d"}])).toBe(false));
 it("accepts a four-person fixed-pair doubles roster",()=>expect(rosterReady("doubles",["a","b","c","d"].map(id=>({id,status:"active",user_id:id})),[{player_a_id:"a",player_b_id:"b"},{player_a_id:"c",player_b_id:"d"}])).toBe(true));
 it("generates odd singles round robins with byes and no repeated fixtures",()=>{const fixtures=generateRoundRobin(["a","b","c","d","e"]).flat().filter(([a,b])=>a&&b);expect(fixtures).toHaveLength(10);expect(new Set(fixtures.map(p=>p.slice().sort().join(":"))).size).toBe(10);});
 it("generates one fixture for two players",()=>expect(generateRoundRobin(["a","b"]).flat()).toEqual([["a","b"]]));
});