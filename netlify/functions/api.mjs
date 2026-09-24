import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = getStore({ name: "tno-data", consistency: "strong" });
const collections = ["orders","applications","press","agenda","shows","gallery","books","president","members","tickets","ticketBookings"];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "newthatertno@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Zinoutno2018";
const SECRET = process.env.TNO_ADMIN_SECRET || "CHANGE_THIS_TNO_ADMIN_SECRET";

const json = (statusCode, body, extra={}) => ({
  statusCode,
  headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store", ...extra},
  body: JSON.stringify(body)
});

const now = () => new Date().toISOString();
const id = p => `${p}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

function cookieValue(cookieHeader, name){
  const m = String(cookieHeader||"").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}
function sign(payload){
  const b = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(b).digest("base64url");
  return `${b}.${sig}`;
}
function verify(token){
  try{
    const [b,s] = String(token||"").split(".");
    if(!b||!s) return null;
    const expected=crypto.createHmac("sha256",SECRET).update(b).digest("base64url");
    if(!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected))) return null;
    const p=JSON.parse(Buffer.from(b,"base64url").toString());
    if(!p.exp || p.exp<Date.now()) return null;
    return p;
  }catch{return null}
}
function isAdmin(event){
  return !!verify(cookieValue(event.headers?.cookie || event.headers?.Cookie, "tno_admin"));
}
function requireAdmin(event){
  return isAdmin(event);
}
async function body(event){
  if(!event.body) return {};
  const raw=event.isBase64Encoded ? Buffer.from(event.body,"base64").toString("utf8") : event.body;
  return JSON.parse(raw);
}

async function seedFor(name){
  try{
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const url = await import("node:url");
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    const p = path.resolve(here,"../seed",`${name}.json`);
    return JSON.parse(await fs.readFile(p,"utf8"));
  }catch{return []}
}
async function readCollection(name){
  const raw=await store.get(`${name}.json`,{type:"text"});
  if(raw!==null){
    try{return JSON.parse(raw)}catch{return []}
  }
  const seed=await seedFor(name);
  await store.set(`${name}.json`,JSON.stringify(seed));
  return seed;
}
async function writeCollection(name,data){
  await store.set(`${name}.json`,JSON.stringify(data));
}

function clean(v){return typeof v==="string"?v.trim():v}
function required(b, fields){
  for(const k of fields) if(b[k]===undefined||b[k]===null||String(b[k]).trim()==="") return k;
  return null;
}

function routePath(event){
  const raw = event.path || new URL(event.rawUrl).pathname;
  return raw.replace(/^\/\.netlify\/functions\/api/,"") || "/";
}

export default async (event) => {
  const path=routePath(event);
  const method=event.httpMethod;
  try{
    if(method==="GET" && path==="/api/health") return json(200,{ok:true,service:"TNO_NETLIFY",time:now()});
    if(method==="GET" && path==="/api/me"){
      const p=verify(cookieValue(event.headers?.cookie||event.headers?.Cookie,"tno_admin"));
      return json(200,p?{authenticated:true,email:p.email,role:p.role}:{authenticated:false});
    }
    if(method==="POST" && path==="/api/login"){
      const b=await body(event);
      if(b.email===ADMIN_EMAIL && b.password===ADMIN_PASSWORD){
        const token=sign({email:ADMIN_EMAIL,role:"رئيس الفرقة",exp:Date.now()+8*60*60*1000});
        return json(200,{ok:true,email:ADMIN_EMAIL,role:"رئيس الفرقة"},{ "Set-Cookie":`tno_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`});
      }
      return json(401,{ok:false,message:"البريد الإلكتروني أو كلمة المرور غير صحيحة"});
    }
    if(method==="POST" && path==="/api/logout"){
      return json(200,{ok:true},{"Set-Cookie":"tno_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"});
    }

    if(method==="GET" && path==="/api/public/site-data"){
      const [press,agenda,shows,gallery,books,president,members,tickets]=await Promise.all(
        ["press","agenda","shows","gallery","books","president","members","tickets"].map(readCollection)
      );
      const cleanTickets=tickets.filter(x=>x&&x.visible!==false).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
      return json(200,{press,agenda,shows,gallery,books,president,members,tickets:cleanTickets});
    }

    if(method==="POST" && path==="/api/public/orders"){
      const b=await body(event); const miss=required(b,["book","name","phone","wilaya","address","quantity"]); if(miss)return json(400,{ok:false,message:`Missing field: ${miss}`});
      const item={id:id("order"),createdAt:now(),status:"new",book:clean(b.book),name:clean(b.name),phone:clean(b.phone),wilaya:clean(b.wilaya),address:clean(b.address),quantity:Number(b.quantity)||1};
      const rows=await readCollection("orders"); rows.unshift(item); await writeCollection("orders",rows); return json(201,{ok:true,item});
    }
    if(method==="POST" && path==="/api/public/applications"){
      const b=await body(event); const miss=required(b,["prenom","nom","email","wilaya","role","message"]); if(miss)return json(400,{ok:false,message:`Missing field: ${miss}`});
      const item={id:id("application"),createdAt:now(),status:"new",prenom:clean(b.prenom),nom:clean(b.nom),email:clean(b.email),phone:clean(b.phone||""),wilaya:clean(b.wilaya),role:clean(b.role),message:clean(b.message)};
      const rows=await readCollection("applications"); rows.unshift(item); await writeCollection("applications",rows); return json(201,{ok:true,item});
    }
    if(method==="POST" && path==="/api/applications/public"){
      const b=await body(event); const miss=required(b,["prenom","nom","email","wilaya","role","message"]); if(miss)return json(400,{ok:false,message:`Missing field: ${miss}`});
      const item={id:id("application"),createdAt:now(),status:"new",prenom:clean(b.prenom),nom:clean(b.nom),email:clean(b.email),phone:clean(b.phone||""),wilaya:clean(b.wilaya),role:clean(b.role),message:clean(b.message)};
      const rows=await readCollection("applications"); rows.unshift(item); await writeCollection("applications",rows); return json(201,{ok:true,item});
    }
    if(method==="POST" && path==="/api/public/tickets"){
      const b=await body(event); const miss=required(b,["ticketId","name","phone","quantity"]); if(miss)return json(400,{ok:false,message:`Missing field: ${miss}`});
      const tickets=await readCollection("tickets"), t=tickets.find(x=>x.id===clean(b.ticketId)&&x.visible!==false&&x.status!=="closed");
      if(!t)return json(404,{ok:false,message:"Ticket event unavailable"});
      const q=Math.max(1,Number(b.quantity)||1);
      const bookings=await readCollection("ticketBookings");
      const booked=bookings.filter(x=>x.ticketId===t.id&&x.status!=="rejected").reduce((n,x)=>n+(Number(x.quantity)||0),0);
      if(t.capacity&&booked+q>Number(t.capacity))return json(409,{ok:false,message:"Not enough tickets available"});
      const item={id:id("ticket-booking"),createdAt:now(),status:"new",ticketId:t.id,name:clean(b.name),phone:clean(b.phone),email:clean(b.email||""),quantity:q,note:clean(b.note||""),eventTitle:t.title,eventDate:t.date||"",eventTime:t.time||"",place:t.place||"",city:t.city||""};
      bookings.unshift(item);await writeCollection("ticketBookings",bookings);return json(201,{ok:true,item});
    }

    if(path.startsWith("/uploads/") && method==="GET"){
      const key=decodeURIComponent(path.slice("/uploads/".length));
      const obj=await store.get(key,{type:"arrayBuffer"});
      if(!obj)return {statusCode:404,body:"Not found"};
      const meta=await store.getMetadata(key).catch(()=>null);
      const contentType=meta?.metadata?.contentType || meta?.contentType || "application/octet-stream";
      return {statusCode:200,isBase64Encoded:true,headers:{"Content-Type":contentType,"Cache-Control":"public,max-age=31536000,immutable"},body:Buffer.from(obj).toString("base64")};
    }

    if(path==="/api/upload" && method==="POST"){
      if(!requireAdmin(event))return json(401,{ok:false,message:"Unauthorized"});
      const b=await body(event);
      const m=String(b.data||"").match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/s);
      if(!m)return json(400,{ok:false,message:"invalid_image"});
      const ext=m[1].includes("png")?".png":m[1].includes("webp")?".webp":m[1].includes("gif")?".gif":".jpg";
      const safe=String(b.name||"tno-image").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||"tno-image";
      const key=`uploads/${Date.now()}-${safe}${ext}`;
      await store.set(key,Buffer.from(m[2],"base64"),{metadata:{contentType:m[1].replace("jpg","jpeg")}});
      return json(201,{ok:true,src:`uploads/${key}`});
    }

    if(path==="/api/dashboard" && method==="GET"){
      if(!requireAdmin(event))return json(401,{ok:false,message:"Unauthorized"});
      const entries=await Promise.all(collections.map(async c=>[c,await readCollection(c)]));
      return json(200,Object.fromEntries(entries));
    }

    const m=path.match(/^\/api\/(orders|applications|press|agenda|shows|gallery|books|president|members|tickets|ticketBookings)(?:\/([^/]+))?$/);
    if(m){
      if(!requireAdmin(event))return json(401,{ok:false,message:"Unauthorized"});
      const c=m[1], itemId=m[2];
      const rows=await readCollection(c);
      if(method==="POST"&&!itemId){
        const b=await body(event);const row={...b,id:b.id||id(c.replace(/s$/,"")),createdAt:b.createdAt||now(),updatedAt:now()};rows.unshift(row);await writeCollection(c,rows);return json(201,{ok:true,item:row});
      }
      if(method==="PATCH"&&itemId){
        const b=await body(event);const i=rows.findIndex(x=>x.id===itemId);if(i<0)return json(404,{ok:false,message:"Not found"});
        rows[i]={...rows[i],...b,id:rows[i].id,updatedAt:now()};await writeCollection(c,rows);return json(200,{ok:true,item:rows[i]});
      }
      if(method==="DELETE"&&itemId){
        const next=rows.filter(x=>x.id!==itemId);if(next.length===rows.length)return json(404,{ok:false,message:"Not found"});await writeCollection(c,next);return json(200,{ok:true});
      }
      return json(405,{ok:false,message:"Method not allowed"});
    }
    return json(404,{ok:false,message:"API route not found"});
  }catch(e){
    console.error(e);
    return json(500,{ok:false,message:e?.message||"Server error"});
  }
};
