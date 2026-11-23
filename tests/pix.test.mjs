import {test} from 'node:test';import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import {quote} from '../lib/pix.js';import create from '../api/pix.js';import status from '../api/pix-status.js';import {verify} from '../lib/http.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(x){this.data=x;return this;}};}
const product=catalog.meusProdutos.find(p=>p.nome==='Quentinha de Bife Acebolado');
test('preço é recalculado com bebida e valores manipulados são ignorados',()=>{
 assert.equal(quote([{id:product.id,quantidade:2,preco:.01,selecoes:[{nome:'Coca cola 2l',tipo:'bebida',qtde:1,preco:0}]}]),55.78);
 assert.throws(()=>quote([{id:'inexistente',quantidade:1}]));assert.throws(()=>quote([{id:product.id,quantidade:-1}]));
});
test('sem chave informa configuração pendente',async()=>{const key=process.env.NEXUSPAG_API_KEY;delete process.env.NEXUSPAG_API_KEY;const res=response();await create({method:'POST',headers:{host:'localhost'},body:{}},res);assert.equal(res.code,503);if(key)process.env.NEXUSPAG_API_KEY=key;});
test('contrato NexusPag, repetição idempotente, token de consulta e dados privados',async()=>{
 const original=globalThis.fetch,oldKey=process.env.NEXUSPAG_API_KEY;process.env.NEXUSPAG_API_KEY='chave-ficticia-teste';
 const oldMode=process.env.PIX_MODE;process.env.PIX_MODE='live';
 const calls=[];
 globalThis.fetch=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>url.endsWith('/create')?{success:true,transaction:{id:'txn-test',amount:18.9,status:'pending',pix_copia_cola:'codigo-teste',qr_code_base64:'abc'}}:{id:'txn-test',amount:18.9,status:'paid',payer_document:'privado'}};};
 try{
 const req={method:'POST',headers:{host:'localhost'},body:{request_id:'12345678-1234-1234-1234-123456789012',cart:[{id:product.id,quantidade:1}]}};
 const first=response();await create(req,first);assert.equal(first.code,200);assert.equal(first.data.transaction.amount,18.9);assert.equal(calls[0].opts.headers['x-api-key'],'chave-ficticia-teste');
 req.headers.cookie=first.headers['Set-Cookie'].split(';')[0];const again=response();await create(req,again);
 assert.equal(JSON.parse(calls[0].opts.body).external_id,JSON.parse(calls[1].opts.body).external_id);
 assert.equal(verify(first.data.access_token).id,'txn-test');assert.ok(!JSON.stringify(first.data).includes('chave-ficticia'));
 const checked=response();await status({method:'GET',headers:{host:'localhost',authorization:'Bearer '+first.data.access_token},query:{id:'txn-test'}},checked);assert.equal(checked.data.transaction.status,'paid');assert.ok(!JSON.stringify(checked.data).includes('privado'));
 const denied=response();await status({method:'GET',headers:{host:'localhost'},query:{id:'txn-test'}},denied);assert.equal(denied.code,401);
 }finally{globalThis.fetch=original;if(oldMode)process.env.PIX_MODE=oldMode;else delete process.env.PIX_MODE;if(oldKey)process.env.NEXUSPAG_API_KEY=oldKey;else delete process.env.NEXUSPAG_API_KEY;}
});
