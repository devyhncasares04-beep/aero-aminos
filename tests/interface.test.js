import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {catalog} from '../server/catalog.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,25));
test('Storefront renders exact catalog, searchable products and one-time cart; guest portal routes require login',async()=>{
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://aero.test/',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};
 w.fetch=async url=>({ok:true,json:async()=>url==='/api/me'?{user:null,csrf:'test'}:{products:catalog.map(p=>({...p,stock:null})),currency:'',checkoutReady:false,paypal:false,zelle:false}});
 try{w.eval(readFileSync('app.js','utf8'));await tick();assert.equal(w.document.querySelectorAll('.product-card').length,21);assert.ok(w.document.body.textContent.includes('Online ordering is not open yet.'));assert.ok(!w.document.body.textContent.includes('Subscribe'));
 w.document.querySelector('[data-action="add"][data-id="AA-001"]').click();await tick();assert.equal(JSON.parse(w.localStorage.getItem('aero-cart'))[0].quantity,1);
 w.location.hash='/cart';await tick();assert.ok(w.document.body.textContent.includes('Retatrutide'));assert.ok(w.document.body.textContent.includes('$59.00'));assert.ok(w.document.body.textContent.includes('There are no recurring charges.'));assert.equal(w.document.querySelector('a[href="#/checkout"]'),null);
 w.location.hash='/inventory';await tick();await tick();assert.equal(w.location.hash,'#/login');assert.ok(w.document.querySelector('#auth-form'));assert.equal(w.document.querySelector('.role-switch'),null);
 w.location.hash='/shop';await tick();const search=w.document.querySelector('#product-search');search.value='NAD';search.dispatchEvent(new w.Event('input',{bubbles:true}));await tick();assert.equal(w.document.querySelectorAll('.product-card').length,1);assert.ok(w.document.querySelector('.product-card').textContent.includes('NAD+'));
 }finally{w.close();}
});
