import {backup} from 'node:sqlite';
import {chmodSync} from 'node:fs';
import {openDatabase} from './db.js';
import {configuration} from './config.js';
const db=openDatabase(configuration().dbPath);const target=process.argv[2];if(!target)throw new Error('Provide an absolute backup destination.');if(!target.startsWith('/'))throw new Error('Backup destination must be absolute.');await backup(db,target);chmodSync(target,0o600);db.close();console.log('Database backup completed.');
