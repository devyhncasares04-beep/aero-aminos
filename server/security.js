import {scrypt,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function validatePassword(value){return typeof value==='string'&&value.length>=15&&value.length<=256;}
export async function hashPassword(value){const salt=randomBytes(16).toString('hex');const hash=await derive(value,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return `${salt}:${hash.toString('hex')}`;}
export async function checkPassword(value,stored){if(typeof value!=='string'||value.length>256)return false;const [salt,hash]=stored.split(':');const result=await derive(value,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return timingSafeEqual(result,Buffer.from(hash,'hex'));}
export function fail(status,message){const error=new Error(message);error.status=status;throw error;}
export function limited(db,key,limit,seconds){const now=Date.now();db.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END').run(key,now+seconds*1000,now,now);const entry=db.prepare('SELECT count FROM rate_limits WHERE key=?').get(key);if(entry.count>limit)fail(429,'Too many attempts. Please try again later.');}
export const emailValue=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value.trim().toLowerCase():null;
export function field(value,label,max=150){if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x1f]/.test(value))fail(400,`Enter a valid ${label}.`);return value.trim();}
