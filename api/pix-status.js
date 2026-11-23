import {verify,json,allowedOrigin} from '../lib/http.js';import {publicTransaction} from '../lib/pix.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Método não permitido'});
 if(!allowedOrigin(req))return json(res,403,{error:'Origem inválida'});
 const token=verify((req.headers.authorization||'').replace(/^Bearer /,'')),id=req.query?.id;
 if(!token||token.purpose!=='pix'||token.id!==id)return json(res,401,{error:'Acesso à cobrança não autorizado'});
 try{const response=await fetch('https://nexuspag.com/api/pix/'+encodeURIComponent(id),{headers:{'x-api-key':process.env.NEXUSPAG_API_KEY},signal:AbortSignal.timeout(20000)});
 if(!response.ok)return json(res,502,{error:'Consulta indisponível'});
 const data=await response.json(),transaction=data.transaction||data;
 if(transaction.id!==id||Number(transaction.amount)!==token.amount)return json(res,502,{error:'Resposta de pagamento inconsistente'});
 return json(res,200,{transaction:publicTransaction(transaction)});
 }catch(err){console.error('Erro ao consultar cobrança PIX:',err?.message||err);return json(res,502,{error:'Não foi possível consultar o pagamento'});}
}
