import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname} from 'node:path';
import {catalog} from './catalog.js';
export function openDatabase(path){
 if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const db=new DatabaseSync(path);if(path!==':memory:')chmodSync(path,0o600);
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('customer','owner')),verified INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT NOT NULL,strength TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),stock INTEGER CHECK(stock>=0),version INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),request_key TEXT NOT NULL,fingerprint TEXT NOT NULL,method TEXT NOT NULL CHECK(method IN ('paypal','zelle')),status TEXT NOT NULL,fulfillment TEXT NOT NULL DEFAULT 'Unfulfilled',currency TEXT NOT NULL,subtotal INTEGER NOT NULL,shipping INTEGER NOT NULL,tax INTEGER NOT NULL,total INTEGER NOT NULL,lines TEXT NOT NULL,address TEXT NOT NULL,paypal_id TEXT UNIQUE,capture_id TEXT UNIQUE,payment_reference TEXT,tracking_carrier TEXT,tracking_number TEXT,created INTEGER NOT NULL,updated INTEGER NOT NULL,UNIQUE(user_id,request_key));
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,event TEXT NOT NULL,actor TEXT,order_id TEXT,detail TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS webhooks(id TEXT PRIMARY KEY,event TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS refunds(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),amount INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,recipient TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL,expires INTEGER,last_error TEXT,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id,created);
 CREATE INDEX IF NOT EXISTS outbox_pending ON outbox(status,next_attempt);
 PRAGMA user_version=1;`);
 const seed=db.prepare('INSERT OR IGNORE INTO products(id,name,strength,price) VALUES(?,?,?,?)');
 for(const p of catalog)seed.run(p.id,p.name,p.strength,p.price);
 return db;
}
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
export function audit(db,event,actor,order,detail=''){db.prepare('INSERT INTO audit(event,actor,order_id,detail,created) VALUES(?,?,?,?,?)').run(event,actor||null,order||null,detail,Date.now());}
