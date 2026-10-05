export function configuration(env=process.env){
 const integer=(key)=>/^\d+$/.test(env[key]||'')?Number(env[key]):null;
 const production=env.NODE_ENV==='production';
 const origin=env.APP_ORIGIN||'http://localhost:4173';
 if(new URL(origin).origin!==origin)throw new Error('APP_ORIGIN must be an origin without a trailing slash');
 if(production&&!origin.startsWith('https://'))throw new Error('Production requires an HTTPS APP_ORIGIN');
 const config={production,origin,port:Number(env.PORT||3000),dbPath:env.DATABASE_PATH||'./data/aero.sqlite',checkoutEnabled:env.CHECKOUT_ENABLED==='true',policyApproved:env.POLICIES_APPROVED==='true',catalogApproved:env.CATALOG_APPROVED==='true',currency:env.CURRENCY||'',shipping:integer('SHIPPING_CENTS'),taxMode:env.TAX_MODE||'',taxRate:integer('TAX_RATE_BPS'),taxShipping:env.TAX_SHIPPING==='true',countries:(env.SHIPPING_COUNTRIES||'').split(',').filter(Boolean),ownerEmail:env.OWNER_EMAIL||'',supportEmail:env.SUPPORT_EMAIL||'',paypalMode:env.PAYPAL_MODE||'sandbox',paypalClient:env.PAYPAL_CLIENT_ID||'',paypalSecret:env.PAYPAL_CLIENT_SECRET||'',paypalMerchant:env.PAYPAL_MERCHANT_ID||'',paypalWebhook:env.PAYPAL_WEBHOOK_ID||'',paypalApproved:env.PAYPAL_CATALOG_APPROVED==='true',zelleRecipient:env.ZELLE_RECIPIENT||'',zelleName:env.ZELLE_RECIPIENT_NAME||'',zelleApproved:env.ZELLE_BUSINESS_APPROVED==='true',mailHost:env.SMTP_HOST||'',mailPort:Number(env.SMTP_PORT||587),mailUser:env.SMTP_USER||'',mailPassword:env.SMTP_PASSWORD||'',mailFrom:env.MAIL_FROM||'',mailEnabled:env.EMAIL_ENABLED==='true',trustedProxyHops:Number(env.TRUST_PROXY_HOPS||0)};
 if(!['sandbox','live'].includes(config.paypalMode))throw new Error('PAYPAL_MODE must be sandbox or live');
 if(config.taxRate!==null&&config.taxRate>10000)throw new Error('TAX_RATE_BPS out of bounds');
 return config;
}
export function readiness(c){const missing=[];
 if(!c.checkoutEnabled)missing.push('Checkout activation');if(!c.policyApproved)missing.push('Published store policies');if(!c.catalogApproved)missing.push('Catalog and selling territory approval');
 if(c.currency!=='USD')missing.push('Confirmed USD currency');if(c.shipping===null)missing.push('Shipping rate');
 if(!['included','exclusive'].includes(c.taxMode)||c.taxRate===null)missing.push('Reviewed tax configuration');
 if(!c.countries.length||c.countries.some(x=>!/^([A-Z]{2})$/.test(x)))missing.push('Shipping countries');
 if(!c.ownerEmail||!c.supportEmail)missing.push('Owner and support emails');
 if(!c.mailEnabled||!c.mailHost||!c.mailFrom)missing.push('Transactional email');
 const paypal=!!(c.paypalClient&&c.paypalSecret&&c.paypalMerchant&&c.paypalWebhook&&(c.paypalMode==='sandbox'||c.paypalApproved));
 const zelle=!!(c.zelleRecipient&&c.zelleName&&c.zelleApproved);
 if(!paypal&&!zelle)missing.push('Approved payment method');
 return {ready:missing.length===0,missing,paypal,zelle};
}
