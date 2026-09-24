const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const url=require('url');

const PORT=Number(process.env.PORT||3030);
const ADMIN_EMAIL=process.env.ADMIN_EMAIL||'newthatertno@gmail.com';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'Zinoutno2018';
const ROOT=__dirname;
const SITE=path.resolve(ROOT,'..','TNO_SITE');
const PUBLIC=path.resolve(ROOT,'public');
const DATA=path.resolve(ROOT,'data');
const sessions=new Map();
const collections=['orders','applications','press','agenda','shows','gallery','books','president','members','tickets','ticketBookings'];
fs.mkdirSync(DATA,{recursive:true});

function fileFor(name){return path.join(DATA,name+'.json')}
function read(name){try{return JSON.parse(fs.readFileSync(fileFor(name),'utf8'))}catch{return []}}
function write(name,data){const tmp=fileFor(name)+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2),'utf8');fs.renameSync(tmp,fileFor(name))}
function now(){return new Date().toISOString()}
function id(prefix){return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`}
function clean(v){return typeof v==='string'?v.trim():v}
function send(res,status,obj,headers={}){const body=typeof obj==='string'?obj:JSON.stringify(obj);res.writeHead(status,{'Content-Type':typeof obj==='string'?'text/plain; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(body)}
function parseCookies(req){const out={};for(const part of (req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}return out}
function isAdmin(req){const token=parseCookies(req).tno_admin;return !!token&&sessions.has(token)}
function requireAdmin(req,res){if(!isAdmin(req)){send(res,401,{ok:false,message:'Unauthorized'});return false}return true}
function jsonBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>25e6){req.destroy();return}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)})}
function required(res,fields){for(const [k,v] of Object.entries(fields)){if(v===undefined||v===null||String(v).trim()===''){send(res,400,{ok:false,message:`Missing field: ${k}`});return false}}return true}
function safeFile(root,pathname){const cleanPath=pathname.split('?')[0].replace(/\\/g,'/');const rel=cleanPath.replace(/^\/+/, '');const full=path.resolve(root,rel);return full===root||full.startsWith(root+path.sep)?full:null}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif','.wav':'audio/wav','.mp4':'video/mp4','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
function staticFile(res,root,pathname){const p=safeFile(root,pathname);if(!p)return false;let file=p;try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);return true}catch{return false}}

function contentType(ext){return mime[ext]||'application/octet-stream'}
function saveUploadedImage(name,dataUrl){
  const m=String(dataUrl||'').match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/s);
  if(!m) throw new Error('invalid_image');
  const ext=m[1].includes('jpeg')||m[1].includes('jpg')?'.jpg':m[1].includes('png')?'.png':m[1].includes('webp')?'.webp':'.gif';
  const safe=String(name||'tno-image').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'tno-image';
  const filename=`${Date.now()}-${safe}${ext}`;
  const dir=path.join(SITE,'assets','uploads'); fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,filename),Buffer.from(m[2],'base64'));
  return `assets/uploads/${filename}`;
}

async function handler(req,res){
  const parsed=url.parse(req.url,true);const pathname=parsed.pathname;
  try{
    if(req.method==='GET'&&pathname==='/api/health')return send(res,200,{ok:true,service:'TNO_ADMIN',time:now()});
    if(req.method==='GET'&&pathname==='/api/public/site-data'){const tickets=read('tickets').filter(x=>x&&x.visible!==false).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);return send(res,200,{press:read('press'),agenda:read('agenda'),shows:read('shows'),gallery:read('gallery'),books:read('books'),president:read('president'),members:read('members'),tickets});}
    if(req.method==='POST'&&pathname==='/api/public/orders'){
      const b=await jsonBody(req);if(!required(res,{book:b.book,name:b.name,phone:b.phone,wilaya:b.wilaya,address:b.address,quantity:b.quantity}))return;
      const item={id:id('order'),createdAt:now(),status:'new',book:clean(b.book),name:clean(b.name),phone:clean(b.phone),wilaya:clean(b.wilaya),address:clean(b.address),quantity:Number(b.quantity)||1};const rows=read('orders');rows.unshift(item);write('orders',rows);return send(res,201,{ok:true,item});
    }
    if(req.method==='POST'&&pathname==='/api/public/tickets') {
      const b=await jsonBody(req);if(!required(res,{ticketId:b.ticketId,name:b.name,phone:b.phone,quantity:b.quantity}))return;
      const ticketId=clean(b.ticketId);const tickets=read('tickets');const t=tickets.find(x=>x.id===ticketId&&x.visible!==false&&x.status!=='closed');if(!t)return send(res,404,{ok:false,message:'Ticket event unavailable'});
      const q=Math.max(1,Number(b.quantity)||1);const booked=(read('ticketBookings').filter(x=>x.ticketId===ticketId&&x.status!=='rejected').reduce((n,x)=>n+(Number(x.quantity)||0),0));
      if(t.capacity&&booked+q>Number(t.capacity))return send(res,409,{ok:false,message:'Not enough tickets available'});
      const item={id:id('ticket-booking'),createdAt:now(),status:'new',ticketId,name:clean(b.name),phone:clean(b.phone),email:clean(b.email||''),quantity:q,note:clean(b.note||''),eventTitle:t.title,eventDate:t.date||'',eventTime:t.time||'',place:t.place||'',city:t.city||''};const rows=read('ticketBookings');rows.unshift(item);write('ticketBookings',rows);return send(res,201,{ok:true,item});
    }
    if(req.method==='POST'&&pathname==='/api/public/applications'){
      const b=await jsonBody(req);if(!required(res,{prenom:b.prenom,nom:b.nom,email:b.email,wilaya:b.wilaya,role:b.role,message:b.message}))return;
      const item={id:id('application'),createdAt:now(),status:'new',prenom:clean(b.prenom),nom:clean(b.nom),email:clean(b.email),phone:clean(b.phone||''),wilaya:clean(b.wilaya),role:clean(b.role),message:clean(b.message)};const rows=read('applications');rows.unshift(item);write('applications',rows);return send(res,201,{ok:true,item});
    }
    // Registration aliases: all point to the same applications store.
    if(req.method==='POST'&&pathname==='/api/applications/public'){
      const b=await jsonBody(req);if(!required(res,{prenom:b.prenom,nom:b.nom,email:b.email,wilaya:b.wilaya,role:b.role,message:b.message}))return;
      const item={id:id('application'),createdAt:now(),status:'new',prenom:clean(b.prenom),nom:clean(b.nom),email:clean(b.email),phone:clean(b.phone||''),wilaya:clean(b.wilaya),role:clean(b.role),message:clean(b.message)};
      const rows=read('applications');rows.unshift(item);write('applications',rows);return send(res,201,{ok:true,item});
    }
    if(req.method==='POST'&&pathname==='/api/login'){
      const b=await jsonBody(req);if(b.email===ADMIN_EMAIL&&b.password===ADMIN_PASSWORD){const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{email:ADMIN_EMAIL,role:'رئيس الفرقة',expires:Date.now()+8*60*60*1000});return send(res,200,{ok:true,email:ADMIN_EMAIL,role:'رئيس الفرقة'},{'Set-Cookie':`tno_admin=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`})}return send(res,401,{ok:false,message:'البريد الإلكتروني أو كلمة المرور غير صحيحة'});
    }
    if(req.method==='POST'&&pathname==='/api/logout'){const token=parseCookies(req).tno_admin;sessions.delete(token);return send(res,200,{ok:true},{'Set-Cookie':'tno_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})}
    if(req.method==='GET'&&pathname==='/api/me'){const token=parseCookies(req).tno_admin;const s=sessions.get(token);if(!s||s.expires<Date.now())return send(res,200,{authenticated:false});return send(res,200,{authenticated:true,email:s.email,role:s.role})}
    if(req.method==='POST'&&pathname==='/api/upload'){
      if(!requireAdmin(req,res))return;
      const b=await jsonBody(req);
      try{const src=saveUploadedImage(b.name,b.data);return send(res,201,{ok:true,src});}
      catch(e){return send(res,400,{ok:false,message:e.message||'Upload failed'});}
    }
    if(pathname==='/api/dashboard'&&req.method==='GET'){if(!requireAdmin(req,res))return;const out={};collections.forEach(c=>out[c]=read(c));return send(res,200,out)}
    const m=pathname.match(/^\/api\/(orders|applications|press|agenda|shows|gallery|books|president|members|tickets|ticketBookings)(?:\/([^/]+))?$/);
    if(m){if(!requireAdmin(req,res))return;const c=m[1],itemId=m[2];
      if(req.method==='POST'&&!itemId){const b=await jsonBody(req);const row={...b,id:b.id||id(c.replace(/s$/,'')),createdAt:b.createdAt||now(),updatedAt:now()};const rows=read(c);rows.unshift(row);write(c,rows);return send(res,201,{ok:true,item:row})}
      if(req.method==='PATCH'&&itemId){const b=await jsonBody(req);const rows=read(c),i=rows.findIndex(x=>x.id===itemId);if(i<0)return send(res,404,{ok:false,message:'Not found'});rows[i]={...rows[i],...b,id:rows[i].id,updatedAt:now()};write(c,rows);return send(res,200,{ok:true,item:rows[i]})}
      if(req.method==='DELETE'&&itemId){const rows=read(c),next=rows.filter(x=>x.id!==itemId);if(next.length===rows.length)return send(res,404,{ok:false,message:'Not found'});write(c,next);return send(res,200,{ok:true})}
      return send(res,405,{ok:false,message:'Method not allowed'});
    }
    if(pathname.startsWith('/api/'))return send(res,404,{ok:false,message:'API route not found'});
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{ok:false,message:'Method not allowed'});
    if(pathname==='/admin'||pathname==='/admin/')return staticFile(res,PUBLIC,'admin.html')?undefined:send(res,404,'Not found');
    if(pathname.startsWith('/admin/'))return staticFile(res,PUBLIC,pathname.slice('/admin/'.length))?undefined:send(res,404,'Not found');
    if(staticFile(res,SITE,pathname.slice(1)))return;
    return staticFile(res,SITE,'index.html')?undefined:send(res,404,'Site file not found');
  }catch(e){console.error(e);send(res,500,{ok:false,message:'Server error'})}
}

const server=http.createServer((req,res)=>handler(req,res));
server.listen(PORT,'127.0.0.1',()=>console.log(`TNO connected server running at http://127.0.0.1:${PORT}`));
