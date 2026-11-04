const {onSchedule}=require('firebase-functions/v2/scheduler');
const admin=require('firebase-admin');
admin.initializeApp();

// Runs every minute: sends every alert whose time has come, then deletes it.
exports.sendAlerts=onSchedule('every 1 minutes',async()=>{
  const db=admin.firestore(),now=Date.now();
  const snap=await db.collection('alerts').where('fireAt','<=',now).limit(300).get();
  for(const d of snap.docs){
    const a=d.data();
    const dev=await db.doc('devices/'+a.uid).get();
    const tokens=(dev.data()||{}).tokens||[];
    if(tokens.length&&now-a.fireAt<24*36e5){
      const r=await admin.messaging().sendEachForMulticast({
        tokens,
        data:{title:a.title||'Calendar',body:a.body||'',tag:a.tag||''},
        android:{priority:'high'},
        webpush:{headers:{Urgency:'high',TTL:'3600'}}
      });
      const bad=[];
      r.responses.forEach((x,i)=>{
        const c=(x.error&&x.error.code)||'';
        if(!x.success&&/not-registered|invalid-argument|invalid-registration/.test(c))bad.push(tokens[i]);
      });
      if(bad.length)await dev.ref.update({tokens:admin.firestore.FieldValue.arrayRemove(...bad)});
    }
    await d.ref.delete();
  }
});

