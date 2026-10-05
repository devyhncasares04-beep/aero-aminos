import nodemailer from 'nodemailer';
import {digest} from './security.js';
export function queue(db,key,to,subject,body,expires=null){db.prepare('INSERT OR IGNORE INTO outbox(id,recipient,subject,body,next_attempt,expires,created) VALUES(?,?,?,?,?,?,?)').run(digest(key),to,subject,body,Date.now(),expires,Date.now());}
export function mailWorker(db,c,transportOverride){const transport=transportOverride||(c.mailHost?nodemailer.createTransport({host:c.mailHost,port:c.mailPort,secure:c.mailPort===465,requireTLS:c.mailPort!==465,auth:c.mailUser?{user:c.mailUser,pass:c.mailPassword}:undefined,connectionTimeout:10000,socketTimeout:20000}):null);let busy=false;
 return async()=>{if(busy||!c.mailEnabled||!transport)return;busy=true;try{
  db.prepare("UPDATE outbox SET status='expired',body='' WHERE expires IS NOT NULL AND expires<? AND body<>'' AND status<>'accepted'").run(Date.now());
  const rows=db.prepare("SELECT * FROM outbox WHERE status='pending' AND next_attempt<=? ORDER BY created LIMIT 10").all(Date.now());
  for(const mail of rows){if(mail.expires&&mail.expires<Date.now()){db.prepare("UPDATE outbox SET status='expired',body='' WHERE id=?").run(mail.id);continue;}
   try{const result=await transport.sendMail({from:c.mailFrom,to:mail.recipient,replyTo:c.supportEmail,subject:mail.subject,text:mail.body,messageId:`<${mail.id}@${new URL(c.origin).hostname}>`});if(result.rejected?.length)throw new Error('Recipient rejected');db.prepare("UPDATE outbox SET status='accepted',body='',last_error=NULL WHERE id=?").run(mail.id);
   }catch(error){const tries=mail.attempts+1;const permanent=Number(error.responseCode)>=500;db.prepare('UPDATE outbox SET status=?,attempts=?,next_attempt=?,last_error=? WHERE id=?').run(tries>=5||permanent?'failed':'pending',tries,Date.now()+Math.min(3600000,30000*2**tries),'Mail provider did not accept message',mail.id);}
  }
 }finally{busy=false;}};
}
