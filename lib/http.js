import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
export function json(res,status,data){res.setHeader('Cache-Control','no-store');return res.status(status).json(data);}
const secret=()=>process.env.PIX_SESSION_SECRET||process.env.NEXUSPAG_API_KEY;
function mac(s){if(!secret())throw new Error('Chave não configurada');return createHmac('sha256',secret()).update(s).digest('base64url');}
export function sign(payload){const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+mac(data);}
export function verify(token){try{const [data,sig,...rest]=String(token).split('.');if(rest.length||!sig)return null;const expected=mac(data);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const p=JSON.parse(Buffer.from(data,'base64url'));return p.exp>Date.now()?p:null;}catch{return null;}}
export function session(req,res){const raw=/\bquintal_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];const old=verify(raw);if(old?.purpose==='session')return old.id;const id=randomUUID();res.setHeader('Set-Cookie',`quintal_session=${sign({id,purpose:'session',exp:Date.now()+86400000*30})};${process.env.VERCEL?' Secure;':''} HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);return id;}
export function allowedOrigin(req){if(!req.headers.origin)return true;try{return new URL(req.headers.origin).host===req.headers.host;}catch{return false;}}
