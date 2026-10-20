import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { combineMatchDateTime, matchDate } from "@/lib/match-scheduling";

export default function MatchDateTimeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date | undefined>(() => matchDate(value));
  const [time, setTime] = useState(value.slice(11, 16));
  useEffect(() => { if (value) { setDay(matchDate(value)); setTime(value.slice(11, 16)); } }, [value]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " ");
  return <div className="space-y-2">
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,0.65fr)] gap-3">
      <div className="min-w-0"><label className="mb-2 block text-sm font-medium">Date</label>
        <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>
          <Button variant="outline" aria-label="Choose Match Date" className="h-11 w-full justify-start gap-2 px-3 font-normal"><CalendarDays className="shrink-0 text-primary" size={16}/><span className="truncate">{day ? format(day, "MMM d, yyyy") : "Choose Date"}</span></Button>
        </PopoverTrigger><PopoverContent align="start" className="w-auto p-0"><Calendar mode="single" selected={day} defaultMonth={day} onSelect={selected => { setDay(selected); onChange(combineMatchDateTime(selected, time)); setOpen(false); }} initialFocus/></PopoverContent></Popover>
      </div>
      <div className="min-w-0"><label htmlFor="match-start-time" className="mb-2 flex items-center gap-2 text-sm font-medium"><Clock size={14} className="text-primary"/>Time</label><Input id="match-start-time" aria-label="Match Start Time" type="time" className="h-11 min-w-0" value={time} onChange={event => { setTime(event.target.value); onChange(combineMatchDateTime(day, event.target.value)); }}/></div>
    </div>
    <p className="text-xs text-muted-foreground">{timezone}</p>
  </div>;
}