import {createApp} from './app.js';
const {app,db,config,flushMail}=createApp();
const server=app.listen(config.port,'0.0.0.0',()=>console.log(`Aero Aminos server listening on port ${config.port}; PayPal ${config.paypalMode}.`));
const mailTimer=setInterval(()=>flushMail().catch(()=>console.error('Mail worker failed')),5000);
const cleanup=setInterval(()=>{const now=Date.now();db.prepare('DELETE FROM sessions WHERE expires<?').run(now);db.prepare('DELETE FROM tokens WHERE expires<?').run(now);db.prepare('DELETE FROM rate_limits WHERE expires<?').run(now);},3600000);
function stop(){clearInterval(mailTimer);clearInterval(cleanup);server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
