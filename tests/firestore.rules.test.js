import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { before, after, beforeEach, test } from "node:test";

let env;
before(async()=>{env=await initializeTestEnvironment({projectId:"talentrealm-rules-test",firestore:{rules:readFileSync("firestore.rules","utf8")}});});
after(async()=>env.cleanup());
beforeEach(async()=>env.clearFirestore());

test("private users are owner-only",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"users/alice"),{email:"private@example.com"}));
  await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(),"users/alice")));
  await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(),"users/alice")));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),"users/alice")));
});
test("public profile has public reads and owner-only safe writes",async()=>{
  const alice=env.authenticatedContext("alice").firestore(), bob=env.authenticatedContext("bob").firestore();
  await assertSucceeds(setDoc(doc(alice,"publicProfiles/alice"),{name:"Ella",department:"CS"}));
  await assertSucceeds(getDoc(doc(bob,"publicProfiles/alice")));
  await assertFails(setDoc(doc(bob,"publicProfiles/alice"),{name:"spoof"}));
  await assertFails(setDoc(doc(alice,"publicProfiles/alice"),{name:"Ella",email:"private@example.com"}));
});
test("listing owner required; public read; owner controls immutable ownerId",async()=>{
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore();
  const listing={ownerId:"alice",ownerName:"Ella",type:"service",title:"Design",description:"Logo design",category:"Design",price:1000,skills:[],imageUrls:[],createdAt:1};
  await assertSucceeds(setDoc(doc(alice,"listings/l1"),listing));
  await assertSucceeds(getDoc(doc(bob,"listings/l1")));
  await assertFails(updateDoc(doc(alice,"listings/l1"),{ownerId:"bob"}));
  await assertFails(deleteDoc(doc(bob,"listings/l1")));
});
test("exchange proposals are participant-readable and approval is actor-bound",async()=>{
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore(),mallory=env.authenticatedContext("mallory").firestore();
  const proposal={type:"direct",status:"pending_approval",participants:["alice","bob"],participantNames:{alice:"Alice",bob:"Bob"},items:[
    {providerId:"alice",receiverId:"bob",title:"Design",estimatedValue:100,reason:"Estimate",delivered:false,confirmed:false},
    {providerId:"bob",receiverId:"alice",title:"Photo",estimatedValue:100,reason:"Estimate",delivered:false,confirmed:false}],
    topUp:{amount:0,payerId:"alice",payeeId:"bob",status:"suggested"},approvals:{alice:"accepted",bob:"pending"},createdBy:"alice",createdAt:1,updatedAt:1};
  await assertSucceeds(setDoc(doc(alice,"exchanges/e1"),proposal));
  await assertSucceeds(getDoc(doc(bob,"exchanges/e1")));
  await assertFails(getDoc(doc(mallory,"exchanges/e1")));
  await assertFails(setDoc(doc(mallory,"exchanges/e2"),{...proposal,createdBy:"alice"}));
  await assertFails(updateDoc(doc(alice,"exchanges/e1"),{status:"completed"}));
  await assertSucceeds(updateDoc(doc(bob,"exchanges/e1"),{approvals:{alice:"accepted",bob:"accepted"},status:"awaiting_arrangement",updatedAt:2}));
  await assertFails(updateDoc(doc(alice,"exchanges/e1"),{approvals:{alice:"accepted",bob:"declined"},status:"cancelled",updatedAt:3}));
});
test("exchange delivery can only be marked by provider and confirmation by receiver",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"exchanges/e1"),{type:"direct",status:"in_progress",participants:["alice","bob"],createdBy:"alice",createdAt:1,updatedAt:1,approvals:{alice:"accepted",bob:"accepted"},items:[{providerId:"alice",receiverId:"bob",title:"Design",estimatedValue:0,reason:"",delivered:false,confirmed:false},{providerId:"bob",receiverId:"alice",title:"Photo",estimatedValue:0,reason:"",delivered:false,confirmed:false}]}));
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore();
  await assertSucceeds(updateDoc(doc(alice,"exchanges/e1"),{items:[{providerId:"alice",receiverId:"bob",title:"Design",estimatedValue:0,reason:"",delivered:true,deliveredAt:2,confirmed:false},{providerId:"bob",receiverId:"alice",title:"Photo",estimatedValue:0,reason:"",delivered:false,confirmed:false}],status:"in_progress",updatedAt:2}));
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"exchanges/e2"),{type:"direct",status:"in_progress",participants:["alice","bob"],createdBy:"alice",createdAt:1,updatedAt:1,approvals:{alice:"accepted",bob:"accepted"},items:[{providerId:"alice",receiverId:"bob",title:"Design",estimatedValue:0,reason:"",delivered:false,confirmed:false},{providerId:"bob",receiverId:"alice",title:"Photo",estimatedValue:0,reason:"",delivered:false,confirmed:false}]}));
  await assertFails(updateDoc(doc(bob,"exchanges/e2"),{items:[{providerId:"alice",receiverId:"bob",title:"Design",estimatedValue:0,reason:"",delivered:true,deliveredAt:2,confirmed:false},{providerId:"bob",receiverId:"alice",title:"Photo",estimatedValue:0,reason:"",delivered:false,confirmed:false}],status:"in_progress",updatedAt:2}));
});
test("notifications cannot be forged; owner can only mark read",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"notifications/n1"),{userId:"alice",read:false,title:"hi"}));
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore(),mallory=env.authenticatedContext("mallory").firestore();
  await assertSucceeds(updateDoc(doc(alice,"notifications/n1"),{read:true}));
  await assertFails(updateDoc(doc(alice,"notifications/n1"),{title:"changed"}));
  await assertFails(updateDoc(doc(bob,"notifications/n1"),{read:true}));
  await assertFails(setDoc(doc(alice,"notifications/n2"),{userId:"alice",read:false}));
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"exchanges/e-notify"),{participants:["alice","bob"]}));
  await assertSucceeds(setDoc(doc(bob,"notifications/n3"),{userId:"alice",actorId:"bob",exchangeId:"e-notify",participants:["alice","bob"],type:"exchange_proposed",title:"Proposal",body:"A proposal arrived",read:false,createdAt:3}));
  await assertFails(setDoc(doc(mallory,"notifications/n4"),{userId:"alice",actorId:"mallory",exchangeId:"e-notify",participants:["alice","bob"],type:"exchange_proposed",title:"Fake",body:"No",read:false,createdAt:3}));
});
test("arrangement is submitted by listing owner and confirmed by the other participant",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"exchanges/arr1"),{type:"direct",status:"awaiting_arrangement",participants:["bob","alice"],createdBy:"bob",createdAt:1,updatedAt:1,approvals:{bob:"accepted",alice:"accepted"},items:[{providerId:"bob",receiverId:"alice",listingId:"b1",title:"Coding",delivered:false,confirmed:false},{providerId:"alice",receiverId:"bob",listingId:"a1",title:"Design",delivered:false,confirmed:false}]}));
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore();
  const arrangement={submittedBy:"alice",location:"Awka campus",venue:"Library",dateTime:"2026-11-10T12:00",notes:"Meet outside",status:"pending_confirmation",submittedAt:2};
  await assertFails(updateDoc(doc(bob,"exchanges/arr1"),{arrangement:{...arrangement,submittedBy:"bob"},status:"awaiting_confirmation",updatedAt:2}));
  await assertSucceeds(updateDoc(doc(alice,"exchanges/arr1"),{arrangement,status:"awaiting_confirmation",updatedAt:2}));
  const reviewed={...arrangement,status:"confirmed",reviewedBy:"bob",reviewedAt:3,feedback:""};
  await assertFails(updateDoc(doc(alice,"exchanges/arr1"),{arrangement:reviewed,status:"accepted",updatedAt:3}));
  await assertSucceeds(updateDoc(doc(bob,"exchanges/arr1"),{arrangement:reviewed,status:"accepted",updatedAt:3}));
});
test("exchange requests are public when open and owner-controlled",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),"exchangeRequests/r1"),{ownerId:"alice",status:"open"}));
  const alice=env.authenticatedContext("alice").firestore(),bob=env.authenticatedContext("bob").firestore();
  await assertSucceeds(getDoc(doc(bob,"exchangeRequests/r1")));
  await assertSucceeds(updateDoc(doc(alice,"exchangeRequests/r1"),{status:"closed"}));
  await assertFails(updateDoc(doc(bob,"exchangeRequests/r1"),{status:"paused"}));
});
