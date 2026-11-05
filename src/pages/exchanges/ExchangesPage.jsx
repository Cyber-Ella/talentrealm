import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { watchMyExchanges } from "../../services/exchanges";
import StatusChip from "../../components/StatusChip";
const OPEN = ["pending_approval", "accepted", "in_progress", "awaiting_confirmation"];
export default function ExchangesPage() {
  const { user } = useAuth(); const [list, setList] = useState(null); const [tab, setTab] = useState("open");
  useEffect(() => watchMyExchanges(user.uid, setList), [user.uid]);
  if (!list) return <div className="tr-exchange-loading">Gathering your exchanges…</div>;
  const shown = list.filter(x => tab === "open" ? OPEN.includes(x.status) : !OPEN.includes(x.status));
  const names = x => x.participants.filter(p => p !== user.uid).map(p => (x.participantNames?.[p] || "Student").split(" ")[0]).join(" and ");
  return <main className="tr-exchanges-page">
    <header className="tr-exchanges-heading"><div><span className="tr-eyebrow">COLLABORATION, IN MOTION</span><h1>Your <em>exchanges</em></h1><p>Every agreement starts with a conversation. Keep track of yours here.</p></div><Link className="tr-exchange-new" to="/exchanges/new">Find a match ↗</Link></header>
    <section className="tr-exchange-summary"><div><strong>{list.filter(x=>OPEN.includes(x.status)).length}</strong><span>In progress</span></div><div><strong>{list.filter(x=>x.status==='completed').length}</strong><span>Completed</span></div><div><strong>{list.filter(x=>x.status==='pending_approval').length}</strong><span>Awaiting approval</span></div></section>
    <div className="tr-exchange-tabs"><button className={"tab"+(tab==="open"?" on":"")} onClick={()=>setTab("open")}>Ongoing <span>{list.filter(x=>OPEN.includes(x.status)).length}</span></button><button className={"tab"+(tab==="done"?" on":"")} onClick={()=>setTab("done")}>Past exchanges <span>{list.filter(x=>!OPEN.includes(x.status)).length}</span></button></div>
    {shown.length===0 ? <div className="tr-exchange-empty"><span>⇄</span><h2>{tab==="open"?"Your next exchange starts here":"No past exchanges yet"}</h2><p>{tab==="open"?"Explore student talents and propose a skill swap that works for both of you.":"Completed and cancelled exchanges will be collected here."}</p>{tab==="open"&&<Link to="/exchanges/new">Discover possible matches ↗</Link>}</div> : <div className="tr-exchange-list">{shown.map(x=><Link key={x.id} to={"/exchanges/"+x.id} className="tr-exchange-list-card"><span className="tr-exchange-card-type">{x.type==="circle"?"THREE-PERSON CIRCLE":"DIRECT SWAP"}</span><div className="tr-exchange-card-top"><strong>{x.type==="circle"?"Skill circle":"Skill exchange"}<small> with {names(x)}</small></strong><StatusChip status={x.status}/></div><p>{x.items.map(i=>i.title).join(" · ")}</p><span className="tr-exchange-card-open">Open exchange <b>↗</b></span></Link>)}</div>}
  </main>;
}
