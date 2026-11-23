import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import create from '../api/pix.js';import status from '../api/pix-status.js';import './build.mjs';
const root=path.resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 try{const url=new URL(req.url,'http://localhost');req.query=Object.fromEntries(url.searchParams);
 if(url.pathname==='/api/pix'||url.pathname==='/api/pix-status'){
 if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000){res.statusCode=413;return res.end();}}req.body=JSON.parse(raw||'{}');}
 return await (url.pathname==='/api/pix'?create:status)(req,res);}
 if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end();}
 const pathname=decodeURIComponent(url.pathname);if(pathname.split('/').some(p=>p.startsWith('.'))){res.statusCode=404;return res.end();}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!mime[path.extname(file)]){res.statusCode=404;return res.end();}
 const data=await fs.readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]);res.setHeader('Cache-Control','no-cache');res.end(req.method==='HEAD'?undefined:data);
 }catch{res.statusCode=400;res.end('Não foi possível abrir este recurso');}
}).listen(Number(process.env.PORT||8766),'127.0.0.1',()=>console.log('Quintal da Brasa: http://127.0.0.1:'+(process.env.PORT||8766)));
