import {createHash} from 'node:crypto';
import {quote,createCharge,publicTransaction} from '../lib/pix.js';
import {json,session,sign,allowedOrigin} from '../lib/http.js';
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Método não permitido'});}
 if(!allowedOrigin(req))return json(res,403,{error:'Origem inválida'});
 if(!process.env.NEXUSPAG_API_KEY)return json(res,503,{error:'Configure NEXUSPAG_API_KEY no ambiente do servidor.'});
 if(process.env.PIX_MODE!=='live')return json(res,503,{error:'Pagamentos reais estão desativados no modo demonstração.'});
 try{
 const data=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!/^[a-f0-9-]{36}$/.test(data?.request_id||''))return json(res,400,{error:'Identificador do pedido inválido'});
 const sid=session(req,res);
 let amount, external_id;
 if(data?.type==='fee'||data?.is_fee===true){
  amount=9.90;
  external_id='srv-fee-'+createHash('sha256').update(sid+data.request_id).digest('hex');
 }else{
  amount=quote(data.cart);
  const fingerprint=JSON.stringify({cart:data.cart,address:data.address,delivery:data.delivery,customer:data.customer});
  external_id='srv-'+createHash('sha256').update(sid+data.request_id+fingerprint).digest('hex');
 }
 const transaction=publicTransaction(await createCharge({amount,external_id,description:'Serviço'},process.env.NEXUSPAG_API_KEY));
 if(Number(transaction.amount)!==amount)return json(res,502,{error:'O valor retornado pela NexusPag não confere com o pedido.'});
 return json(res,200,{transaction,access_token:sign({purpose:'pix',id:transaction.id,amount,exp:Date.now()+86400000})});
 }catch(err){console.error('Erro ao gerar cobrança PIX:',err?.message||err);return json(res,400,{error:err?.message||'Não foi possível gerar o PIX. Confira a sacola e tente novamente.'});}
}
