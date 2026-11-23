import catalog from '../data/catalog.json' with {type:'json'};
const cents=n=>Math.round(n*100);
function quantity(n){if(!Number.isInteger(n)||n<1||n>50)throw new Error('Quantidade inválida');return n;}
export function quote(cart){
 if(!Array.isArray(cart)||!cart.length||cart.length>100)throw new Error('Sacola inválida');
 let total=0;
 for(const item of cart){
  const alias={'orderbump-coca-lata':'coca-350ml','orderbump-coca-zero-lata':'coca-zero-350ml'};
  const p=catalog.meusProdutos.find(p=>p.id===(alias[item.id]||item.id));if(!p)throw new Error('Produto inválido');
  let unit=cents(p.preco);
  if(item.selecoes!==undefined&&!Array.isArray(item.selecoes))throw new Error('Opções inválidas');
  for(const s of item.selecoes||[]){
   if(['adicional','bebida'].includes(s.tipo)){
    const extras=s.tipo==='adicional'?catalog.adicionaisAvulsos:catalog.bebidasModal;
    const extra=extras.find(x=>x.nome===s.nome);if(!extra)throw new Error('Adicional inválido');
    unit+=cents(extra.preco)*quantity(s.qtde);
   }else if(s.tipo!=='observacao')throw new Error('Opção inválida');
  }
  total+=unit*quantity(item.quantidade);
 }
 if(total<100||total>1000000)throw new Error('Total fora do limite');return total/100;
}
export async function createCharge(payload,key,fetcher=fetch){
 if(!key)throw new Error('Configure NEXUSPAG_API_KEY no servidor para gerar PIX.');
 const r=await fetcher('https://nexuspag.com/api/pix/create',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({...payload,expiration:1800}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();
 if(!r.ok||!data.success||!data.transaction?.id||!data.transaction?.pix_copia_cola)throw new Error(data?.message||data?.error||'Não foi possível gerar a cobrança na NexusPag.');
 return data.transaction;
}
export function publicTransaction(t){return {id:t.id,status:t.status,amount:t.amount,pix_copia_cola:t.pix_copia_cola,qr_code_base64:t.qr_code_base64,expires_at:t.expires_at};}
