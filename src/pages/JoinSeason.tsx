import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
interface Invite {id:string;name:string;format:string;targeted:boolean;display_name?:string}
export default function JoinSeason(){
 const {token}=useParams();const {user,loading}=useAuth();const navigate=useNavigate();const [invite,setInvite]=useState<Invite|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [declined,setDeclined]=useState(false);
 useEffect(()=>{if(!token)return;supabase.rpc("inspect_season_invite_v2",{_token:token}).then(({data,error})=>{if(error||!data)setError("This invitation is expired, revoked, already claimed, or the roster has been finalized.");else setInvite(data as unknown as Invite);});},[token]);
 const respond=async(decline:boolean)=>{if(!token||busy)return;setBusy(true);const {data,error}=await supabase.rpc("accept_season_invite_v2",{_token:token,_decline:decline});setBusy(false);if(error)toast({title:error.message,variant:"destructive"});else if(decline)setDeclined(true);else navigate(`/app/seasons/${data}`);};
 return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="w-full max-w-md space-y-5 text-center">{error?<><h1 className="text-page-title">Invite unavailable</h1><p className="text-body">{error}</p><Link to="/" className="text-primary">Back to home</Link></>:declined?<><h1 className="text-page-title">Invitation declined</h1><Link to="/app" className="text-primary">Your seasons</Link></>:!invite||loading?<Loader2 className="mx-auto animate-spin text-primary" aria-label="Loading invitation"/>:<><p className="text-eyebrow">Aether Tennis</p><h1 className="text-page-title">Join {invite.name}</h1><p className="text-body">You've been invited to this {invite.format} season{invite.display_name?` as ${invite.display_name}`:""}.</p>{!user?<Button asChild><Link to={`/auth?next=${encodeURIComponent(`/join/${token}`)}`}>Sign in to accept</Link></Button>:<div className="flex justify-center gap-3"><Button disabled={busy} onClick={()=>respond(false)}>{busy&&<Loader2 className="animate-spin"/>}Accept invitation</Button>{invite.targeted&&<Button variant="ghost" disabled={busy} onClick={()=>respond(true)}>Decline</Button>}</div>}</>}</div></main>;
}
