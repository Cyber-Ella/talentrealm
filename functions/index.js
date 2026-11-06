const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
initializeApp();
const db = getFirestore();
const ts = () => FieldValue.serverTimestamp();
const fail = (code, msg) => { throw new HttpsError(code, msg); };
const clean = (v, max=160) => String(v ?? '').trim().slice(0,max);
const authUid = (req) => { if(!req.auth) fail('unauthenticated','Sign in first.'); return req.auth.uid; };
const getListing = async (id) => {
  if(!id) return null;
  const s=await db.doc(`listings/${id}`).get();
  if(!s.exists) fail('not-found','Listing not found.');
  return {id:s.id,...s.data()};
};
const writeNotification = async (uid, payload) => db.collection('notifications').add({
  userId:uid,type:clean(payload.type,40),title:clean(payload.title,100),body:clean(payload.body,300),
  exchangeId:payload.exchangeId||'',read:false,createdAt:ts()
});
const notifyMany = async (uids,payload) => Promise.all([...new Set(uids)].filter(Boolean).map(uid=>writeNotification(uid,payload)));
const logEvent = async (exchangeId, participants, actor, type, details={}) => db.collection('exchangeEvents').add({
  exchangeId,participants,actorId:actor,type,details,createdAt:ts()
});
const getExchange = async (id) => {
  if(!id) fail('invalid-argument','exchangeId is required.');
  const ref=db.doc(`exchanges/${id}`), snap=await ref.get();
  if(!snap.exists) fail('not-found','Exchange not found.');
  return {ref,ex:snap.data()};
};
const participant = (ex,uid) => { if(!Array.isArray(ex.participants)||!ex.participants.includes(uid)) fail('permission-denied','You are not a participant.'); };
const statusIs = (ex,allowed) => { if(!allowed.includes(ex.status)) fail('failed-precondition',`Exchange is ${ex.status}.`); };
const firstName = (s) => clean(s,80).split(' ')[0] || 'A student';

// One callable handles all exchange lifecycle actions. All writes are validated server-side.
exports.exchangeAction = onCall({maxInstances:10}, async (request) => {
  const uid=authUid(request), d=request.data||{}, action=d.action;
  if(action==='proposePurchase') {
    const listing=await getListing(d.listingId);
    if(listing.ownerId===uid) fail('failed-precondition','You cannot request your own listing.');
    if(listing.type!=='service') fail('failed-precondition','Only service listings can be requested.');
    const participants=[uid,listing.ownerId];
    const ref=db.collection('exchanges').doc();
    const buyerProfile=(await db.doc(`publicProfiles/${uid}`).get()).data()||{};
    const sellerProfile=(await db.doc(`publicProfiles/${listing.ownerId}`).get()).data()||{};
    const amount=Math.max(0,Number(listing.price)||0);
    const ex={type:'purchase',status:'pending_approval',participants,
      participantNames:{[uid]:clean(buyerProfile.name,80),[listing.ownerId]:clean(sellerProfile.name||listing.ownerName,80)},
      items:[{providerId:listing.ownerId,receiverId:uid,listingId:listing.id,title:clean(listing.title,100),estimatedValue:amount,reason:'Owner-listed price.',delivered:false,confirmed:false}],
      topUp:{amount,payerId:uid,payeeId:listing.ownerId,status:'listed_price'},
      approvals:{[uid]:'accepted',[listing.ownerId]:'pending'},createdBy:uid,createdAt:ts(),updatedAt:ts()};
    await ref.set(ex); await logEvent(ref.id,participants,uid,'proposed');
    await notifyMany([listing.ownerId],{type:'proposal',title:'Service request',body:`${firstName(buyerProfile.name)} requested ${listing.title}.`,exchangeId:ref.id});
    return {exchangeId:ref.id};
  }
  if(action==='proposeExchange') {
    const receiverUid=clean(d.receiverUid,128); if(!receiverUid||receiverUid===uid) fail('invalid-argument','Choose another student.');
    const offered= d.offered||{}, requested=d.requested||{};
    if(!clean(offered.title,100)||!clean(requested.title,100)) fail('invalid-argument','Both services need titles.');
    const offerListing=offered.listingId?await getListing(offered.listingId):null;
    const requestListing=requested.listingId?await getListing(requested.listingId):null;
    if(offerListing&&offerListing.ownerId!==uid) fail('permission-denied','Your offered listing must belong to you.');
    if(requestListing&&requestListing.ownerId!==receiverUid) fail('failed-precondition','Requested listing does not belong to this student.');
    const a=Math.max(0,Number(offerListing?.price??offered.price)||0), b=Math.max(0,Number(requestListing?.price??requested.price)||0);
    const participants=[uid,receiverUid], ref=db.collection('exchanges').doc();
    const [p1,p2]=await Promise.all([db.doc(`publicProfiles/${uid}`).get(),db.doc(`publicProfiles/${receiverUid}`).get()]);
    const ex={type:'direct',status:'pending_approval',participants,participantNames:{[uid]:clean(p1.data()?.name,80),[receiverUid]:clean(p2.data()?.name,80)},
      items:[{providerId:uid,receiverId:receiverUid,listingId:offerListing?.id||'',title:clean(offered.title,100),estimatedValue:a,reason:a?'Owner-listed price.':'User estimate.',delivered:false,confirmed:false},
      {providerId:receiverUid,receiverId:uid,listingId:requestListing?.id||'',title:clean(requested.title,100),estimatedValue:b,reason:b?'Owner-listed price.':'User estimate.',delivered:false,confirmed:false}],
      topUp:{amount:Math.abs(a-b),payerId:a>b?uid:receiverUid,payeeId:a>b?receiverUid:uid,status:'suggested'},
      approvals:{[uid]:'accepted',[receiverUid]:'pending'},createdBy:uid,createdAt:ts(),updatedAt:ts()};
    await ref.set(ex); await logEvent(ref.id,participants,uid,'proposed');
    await notifyMany([receiverUid],{type:'proposal',title:'New exchange proposal',body:`${firstName(p1.data()?.name)} proposes ${offered.title} for ${requested.title}.`,exchangeId:ref.id});
    return {exchangeId:ref.id};
  }
  if(action==='createRequest') {
    const offer=clean(d.offer,160), need=clean(d.need,160), description=clean(d.description,700);
    if(offer.length<3||need.length<3) fail('invalid-argument','Offer and need must each be at least 3 characters.');
    const profile=(await db.doc(`publicProfiles/${uid}`).get()).data()||{};
    const ref=db.collection('exchangeRequests').doc();
    await ref.set({ownerId:uid,ownerName:clean(profile.name,80),offer,need,description,
      allowTopUp:!!d.allowTopUp,status:'open',createdAt:ts(),updatedAt:ts()});
    return {requestId:ref.id};
  }
  if(action==='updateRequest') {
    const requestId=clean(d.requestId,128), rref=db.doc(`exchangeRequests/${requestId}`), rs=await rref.get();
    if(!rs.exists) fail('not-found','Exchange request not found.');
    if(rs.data().ownerId!==uid) fail('permission-denied','Only the owner can manage this request.');
    if(!['open','paused','closed'].includes(d.status)) fail('invalid-argument','Invalid request status.');
    if(rs.data().status==='fulfilled') fail('failed-precondition','A fulfilled request cannot be reopened.');
    await db.runTransaction(async tx => {
      const fresh = await tx.get(rref);
      if (!fresh.exists) fail('not-found','Exchange request not found.');
      const current = fresh.data();
      if (current.ownerId !== uid) fail('permission-denied','Only the owner can manage this request.');
      if (current.status === 'fulfilled') fail('failed-precondition','A fulfilled request cannot be reopened.');
      tx.update(rref,{status:d.status,updatedAt:ts()});
    });
    return {status:d.status};
  }
  if(action==='proposeToRequest') {
    const requestId=clean(d.requestId,128), reqRef=db.doc(`exchangeRequests/${requestId}`), reqSnap=await reqRef.get();
    if(!reqSnap.exists||reqSnap.data().status!=='open') fail('not-found','This exchange request is no longer open.');
    const target=reqSnap.data(); if(target.ownerId===uid) fail('failed-precondition','You cannot propose to your own request.');
    const proposal=clean(d.proposal,500); if(proposal.length<3) fail('invalid-argument','Describe your proposal.');
    const ref=db.collection('exchanges').doc(), participants=[uid,target.ownerId];
    const profiles=await Promise.all(participants.map(x=>db.doc(`publicProfiles/${x}`).get()));
    const names=Object.fromEntries(participants.map((x,i)=>[x,clean(profiles[i].data()?.name,80)]));
    await ref.set({type:'request',status:'pending_approval',participants,participantNames:names,
      requestId,requestSnapshot:{offer:target.offer,need:target.need},proposal,
      items:[
        {providerId:uid,receiverId:target.ownerId,title:proposal,estimatedValue:0,reason:'Respondent offer for the request.',delivered:false,confirmed:false},
        {providerId:target.ownerId,receiverId:uid,title:clean(target.offer,160),estimatedValue:0,reason:'Request owner offer.',delivered:false,confirmed:false}
      ],
      approvals:{[uid]:'accepted',[target.ownerId]:'pending'},createdBy:uid,createdAt:ts(),updatedAt:ts()});
    await logEvent(ref.id,participants,uid,'request_proposed');
    await notifyMany([target.ownerId],{type:'proposal',title:'Someone responded to your exchange request',body:`${firstName(names[uid])} sent an exchange proposal.`,exchangeId:ref.id});
    return {exchangeId:ref.id};
  }

  const {ref,ex}=await getExchange(clean(d.exchangeId,128)); participant(ex,uid);
  const others=ex.participants.filter(x=>x!==uid), name=firstName(ex.participantNames?.[uid]);
  if(action==='respond') {
    const answer=d.answer;
    if(!['accepted','declined'].includes(answer)) fail('invalid-argument','Invalid answer.');
    let status;
    await db.runTransaction(async tx => {
      const fresh=await tx.get(ref);
      if(!fresh.exists) fail('not-found','Exchange not found.');
      const current=fresh.data(); participant(current,uid); statusIs(current,['pending_approval']);
      const approvals={...current.approvals,[uid]:answer};
      status=answer==='declined'?'cancelled':Object.values(approvals).every(x=>x==='accepted')?'accepted':'pending_approval';
      let requestRef=null;
      if(status==='accepted' && current.requestId) {
        requestRef=db.doc(`exchangeRequests/${current.requestId}`);
        const requestSnap=await tx.get(requestRef);
        if(!requestSnap.exists || requestSnap.data().status!=='open')
          fail('failed-precondition','This exchange request has already been fulfilled or closed.');
        tx.update(requestRef,{status:'fulfilled',fulfilledBy:current.createdBy,fulfilledExchangeId:d.exchangeId,updatedAt:ts()});
      }
      tx.update(ref,{approvals,status,updatedAt:ts()});
    });
    await logEvent(d.exchangeId,ex.participants,uid,answer);
    await notifyMany(answer==='declined'?others:status==='accepted'?ex.participants:others,{type:answer,title:answer==='declined'?'Exchange declined':status==='accepted'?'Exchange accepted':`${name} accepted`,body:answer==='declined'?'The exchange was declined.':status==='accepted'?'Everyone accepted. You can start the exchange.':'Waiting for the remaining participant(s).',exchangeId:d.exchangeId});
    return {status};
  }
  if(action==='counterTopUp') {
    const amount=Math.max(0,Math.round(Number(d.amount)||0)); if(amount>1000000) fail('invalid-argument','Top-up is too high.');
    await db.runTransaction(async tx=>{const fresh=await tx.get(ref);if(!fresh.exists)fail('not-found','Exchange not found.');
      const current=fresh.data();participant(current,uid);statusIs(current,['pending_approval']);
      if(current.type!=='direct')fail('failed-precondition','Only direct exchanges support a top-up counter.');
      const approvals=Object.fromEntries(current.participants.map(p=>[p,p===uid?'accepted':'pending']));
      tx.update(ref,{'topUp.amount':amount,'topUp.status':'countered','topUp.proposedBy':uid,approvals,status:'pending_approval',updatedAt:ts()});});
    await logEvent(d.exchangeId,ex.participants,uid,'topup_countered',{amount});
    await notifyMany(others,{type:'counter',title:'Top-up counteroffer',body:`${name} suggested ₦${amount.toLocaleString()}.`,exchangeId:d.exchangeId});return {status:'pending_approval'};
  }
  if(action==='start') {
    await db.runTransaction(async tx => { const fresh=await tx.get(ref); if(!fresh.exists)fail('not-found','Exchange not found.');
      const current=fresh.data();participant(current,uid);statusIs(current,['accepted']);tx.update(ref,{status:'in_progress',updatedAt:ts()}); });
    await logEvent(d.exchangeId,ex.participants,uid,'started');await notifyMany(others,{type:'progress',title:'Exchange started',body:`${name} started the exchange.`,exchangeId:d.exchangeId});return {status:'in_progress'};
  }
  if(action==='deliver') {
    let itemTitle='', receiverId='', status='';
    await db.runTransaction(async tx=>{const fresh=await tx.get(ref);if(!fresh.exists)fail('not-found','Exchange not found.');
      const current=fresh.data();participant(current,uid);statusIs(current,['in_progress']);
      const items=(current.items||[]).map(x=>({...x}));const item=items.find(x=>x.providerId===uid&&!x.delivered);
      if(!item)fail('failed-precondition','You have no remaining service to mark delivered.');
      item.delivered=true;item.deliveredAt=Date.now();itemTitle=item.title;receiverId=item.receiverId;
      status=items.every(x=>x.delivered)?'awaiting_confirmation':'in_progress';tx.update(ref,{items,status,updatedAt:ts()});});
    await logEvent(d.exchangeId,ex.participants,uid,'delivered',{item:itemTitle});
    await notifyMany([receiverId],{type:'delivered',title:'Service marked delivered',body:`${name} marked ${itemTitle} delivered. Please confirm.`,exchangeId:d.exchangeId});return {status};
  }
  if(action==='confirm') {
    let itemTitle='',providerId='',status='',completed=false;
    await db.runTransaction(async tx=>{const fresh=await tx.get(ref);if(!fresh.exists)fail('not-found','Exchange not found.');
      const current=fresh.data();participant(current,uid);statusIs(current,['in_progress','awaiting_confirmation']);
      const items=(current.items||[]).map(x=>({...x}));const item=items.find(x=>x.receiverId===uid&&x.delivered&&!x.confirmed);
      if(!item)fail('failed-precondition','Nothing is ready for your confirmation.');
      item.confirmed=true;item.confirmedAt=Date.now();itemTitle=item.title;providerId=item.providerId;
      completed=items.every(x=>x.confirmed);status=completed?'completed':current.status;tx.update(ref,{items,status,updatedAt:ts()});});
    await logEvent(d.exchangeId,ex.participants,uid,'confirmed',{item:itemTitle});
    await notifyMany([providerId],{type:'confirmed',title:'Delivery confirmed',body:`${name} confirmed ${itemTitle}.`,exchangeId:d.exchangeId});
    if(completed){await logEvent(d.exchangeId,ex.participants,uid,'completed');await notifyMany(ex.participants,{type:'completed',title:'Exchange completed',body:'All deliveries were confirmed.',exchangeId:d.exchangeId});}
    return {status};
  }
  if(action==='cancel') {
    await db.runTransaction(async tx=>{const fresh=await tx.get(ref);if(!fresh.exists)fail('not-found','Exchange not found.');
      const current=fresh.data();participant(current,uid);statusIs(current,['pending_approval','accepted']);tx.update(ref,{status:'cancelled',cancelledBy:uid,updatedAt:ts()});});
    await logEvent(d.exchangeId,ex.participants,uid,'cancelled');await notifyMany(others,{type:'cancelled',title:'Exchange cancelled',body:`${name} cancelled the exchange.`,exchangeId:d.exchangeId});return {status:'cancelled'};
  }
  if(action==='report') {
    const text=clean(d.text,1000);if(text.length<5)fail('invalid-argument','Please explain the problem (at least 5 characters).');
    await db.collection('reports').add({exchangeId:d.exchangeId,reporterId:uid,text,status:'open',createdAt:ts()});
    await ref.update({problemReported:true,updatedAt:ts()});await logEvent(d.exchangeId,ex.participants,uid,'reported');await notifyMany(others,{type:'report',title:'Exchange issue reported',body:`${name} reported an issue. Please review the exchange.`,exchangeId:d.exchangeId});return {status:'reported'};
  }
  fail('invalid-argument','Unknown exchange action.');
});

