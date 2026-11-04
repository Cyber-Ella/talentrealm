export function roundTo(n, step = 100) {
  return Math.round(n / step) * step;
}

// The proposer offers a service worth offeredValue and asks for one worth requestedValue.
// If the requested service is worth more, the proposer pays the difference.
// If it is worth less, the other student pays the proposer.
export function computeTopUp({ proposerId, receiverId, offeredValue, requestedValue }) {
  const offered = Number(offeredValue) || 0;
  const requested = Number(requestedValue) || 0;
  const diff = roundTo(requested - offered, 100);
  if (diff === 0) return { amount: 0, payerId: null, payeeId: null };
  if (diff > 0) return { amount: diff, payerId: proposerId, payeeId: receiverId };
  return { amount: -diff, payerId: receiverId, payeeId: proposerId };
}

// members: [{ uid, gives, gets }]  (values in naira)
// Returns who pays whom so that everyone ends up even.
export function settleCircle(members) {
  const nets = members.map((m) => ({ uid: m.uid, net: roundTo((m.gets || 0) - (m.gives || 0), 100) }));
  const drift = nets.reduce((a, n) => a + n.net, 0);
  if (drift !== 0) nets[nets.length - 1].net -= drift; // keep the total at zero
  const payers = nets.filter((n) => n.net > 0).map((n) => ({ ...n }));
  const takers = nets.filter((n) => n.net < 0).map((n) => ({ uid: n.uid, net: -n.net }));
  const transfers = [];
  for (const p of payers) {
    for (const t of takers) {
      if (p.net <= 0) break;
      if (t.net <= 0) continue;
      const amount = Math.min(p.net, t.net);
      transfers.push({ from: p.uid, to: t.uid, amount });
      p.net -= amount;
      t.net -= amount;
    }
  }
  return transfers;
}