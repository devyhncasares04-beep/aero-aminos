import {defineConfig} from 'vite';
import {createApp} from './server/app.js';
import {configuration} from './server/config.js';
export default defineConfig({
 server:{host:'0.0.0.0',allowedHosts:['terminal.local']},
 plugins:[{name:'aero-local-api',apply:'serve',configureServer(server){
  const {app,db}=createApp({config:configuration({...process.env,NODE_ENV:'development',APP_ORIGIN:'http://terminal.local:4173',DATABASE_PATH:'./data/preview.sqlite',CHECKOUT_ENABLED:'false',EMAIL_ENABLED:'false'})});
  server.middlewares.use((req,res,next)=>req.url?.startsWith('/api/')?app(req,res,next):next());
  server.httpServer?.once('close',()=>db.close());
 }}]
});
