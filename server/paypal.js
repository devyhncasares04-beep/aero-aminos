export function paypalClient(config,fetcher=fetch){
 const base=config.paypalMode==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';let cached,until=0;
 async function request(path,{body,requestId,method='GET'}={}){
  if(!cached||Date.now()>until){const response=await fetcher(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(config.paypalClient+':'+config.paypalSecret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('PayPal authentication unavailable');const data=await response.json();if(!data.access_token)throw new Error('PayPal token missing');cached=data.access_token;until=Date.now()+Math.max(0,Number(data.expires_in)-60)*1000;}
  const response=await fetcher(base+path,{method,headers:{Authorization:`Bearer ${cached}`,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{}),Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  if(!response.ok){if(response.status===401)cached=null;const error=new Error('PayPal request could not be completed');error.providerStatus=response.status;throw error;}
  return response.status===204?{}:response.json();
 }
 const value=cents=>(cents/100).toFixed(2);
 return {
  async create(order){const a=JSON.parse(order.address);return request('/v2/checkout/orders',{method:'POST',requestId:'create-'+order.id,body:{intent:'CAPTURE',purchase_units:[{reference_id:order.id,custom_id:order.id,invoice_id:order.id,payee:{merchant_id:config.paypalMerchant},amount:{currency_code:order.currency,value:value(order.total)},shipping:{name:{full_name:a.name},address:{address_line_1:a.line1,...(a.line2?{address_line_2:a.line2}:{}),admin_area_2:a.city,admin_area_1:a.region,postal_code:a.postal,country_code:a.country}}}],payment_source:{paypal:{experience_context:{brand_name:'Aero Aminos',shipping_preference:'SET_PROVIDED_ADDRESS',user_action:'PAY_NOW',return_url:config.origin+'/#/orders',cancel_url:config.origin+'/#/cart'}}}}});},
  capture:id=>request(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,{method:'POST',requestId:'capture-'+id,body:{}}),
  get:id=>request(`/v2/checkout/orders/${encodeURIComponent(id)}`),
  async verify(headers,event){if(!config.paypalWebhook)return false;for(const key of ['paypal-auth-algo','paypal-cert-url','paypal-transmission-id','paypal-transmission-sig','paypal-transmission-time'])if(!headers[key])return false;const result=await request('/v1/notifications/verify-webhook-signature',{method:'POST',body:{auth_algo:headers['paypal-auth-algo'],cert_url:headers['paypal-cert-url'],transmission_id:headers['paypal-transmission-id'],transmission_sig:headers['paypal-transmission-sig'],transmission_time:headers['paypal-transmission-time'],webhook_id:config.paypalWebhook,webhook_event:event}});return result.verification_status==='SUCCESS';}
 };
}
