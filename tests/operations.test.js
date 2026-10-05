import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {backup} from 'node:sqlite';
import {openDatabase} from '../server/db.js';
import {queue,mailWorker} from '../server/mail.js';

test('Online backup restores inventory and durable email work; temporary failure retries without early delivery claims',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'aero-ops-')),db=openDatabase(join(dir,'source.sqlite'));let restored;
 try{db.prepare("UPDATE products SET stock=27 WHERE id='AA-001'").run();queue(db,'test','buyer@example.com','Test','Order message');let attempts=0;const worker=mailWorker(db,{mailEnabled:true,mailFrom:'orders@example.com',supportEmail:'support@example.com',origin:'https://aero.test'},{async sendMail(){attempts++;if(attempts===1)throw Object.assign(new Error('Temporary'),{responseCode:451});return {accepted:['buyer@example.com'],rejected:[]};}});
 await worker();assert.equal(db.prepare('SELECT status FROM outbox').get().status,'pending');await worker();assert.equal(attempts,1);
 await backup(db,join(dir,'restored.sqlite'));restored=openDatabase(join(dir,'restored.sqlite'));assert.equal(restored.prepare("SELECT stock FROM products WHERE id='AA-001'").get().stock,27);assert.equal(restored.prepare('SELECT status FROM outbox').get().status,'pending');
 db.prepare('UPDATE outbox SET next_attempt=0').run();await worker();assert.equal(attempts,2);assert.deepEqual({...db.prepare('SELECT status,body FROM outbox').get()},{status:'accepted',body:''});
 queue(db,'expired','buyer@example.com','Old','Secret link',Date.now()-1);await worker();assert.equal(db.prepare("SELECT body FROM outbox WHERE status='expired'").get().body,'');assert.equal(attempts,2);
 }finally{restored?.close();db.close();rmSync(dir,{recursive:true,force:true});}
});
