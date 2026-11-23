(function(){
 'use strict';
 const enabled=window.QUINTAL_PAYMENT_MODE!=='live',fee=9.9,key='quintal_demo_order';
 const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const write=o=>sessionStorage.setItem(key,JSON.stringify(o));
 window.QuintalDemo={enabled,generate(cart,total){
  if(!enabled)return;
  const panel=document.getElementById('pixPanel');panel.hidden=false;panel.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='PIX de teste gerado';
  const description=document.createElement('p');description.textContent='Pagamento inicial: '+money(total)+'. Nenhum código bancário ou cobrança real foi criado.';
  const note=document.createElement('p');note.textContent='Na próxima etapa: taxa simulada de '+money(fee)+'. Total do fluxo: '+money(total+fee)+'.';
  const button=document.createElement('button');button.type='button';button.className='btn btn-pix';button.textContent='Confirmar pagamento simulado';
  button.onclick=()=>{button.disabled=true;write({id:crypto.randomUUID(),subtotal:total,fee,total:Math.round((total+fee)*100)/100,items:cart.map(i=>({nome:i.nome,quantidade:i.quantidade})),initialPaid:true,feePaid:false,step:0,createdAt:Date.now()});location.href='/taxa.html';};
  panel.append(heading,description,note,button);document.getElementById('btnGerarPix').textContent='Gerar PIX de teste novamente';
 }};
 const generate=document.getElementById('btnGerarPix');
 if(generate&&enabled){
  generate.textContent='Gerar PIX de teste';
  const notice=document.getElementById('demoPaymentNotice');notice.hidden=false;
  const update=()=>{const cart=window.__cart?.getCart()||[];const total=window.__cart?.calcTotal(cart)||0;document.getElementById('demoPaymentTotal').textContent='Pedido: '+money(total)+' + taxa: '+money(fee)+' = total: '+money(total+fee);};
  update();document.addEventListener('click',()=>queueMicrotask(update));
 }
 const page=document.body.dataset.demoPage;
 if(!page)return;
 const order=read();
 if(!order?.initialPaid){location.replace('/checkout.html');return;}
 document.querySelectorAll('[data-order-id]').forEach(e=>e.textContent=order.id.slice(0,8).toUpperCase());
 document.querySelectorAll('[data-order-total]').forEach(e=>e.textContent=money(order.total));
 document.querySelectorAll('[data-order-subtotal]').forEach(e=>e.textContent=money(order.subtotal));
 if(page==='fee'){
  if(order.feePaid){location.replace('/status.html');return;}
  if(!enabled){
   document.querySelectorAll('.demo').forEach(e=>e.style.display='none');
   document.querySelectorAll('.muted.center').forEach(e=>{if(e.textContent.includes('simulado'))e.textContent='Efetue o pagamento da taxa para liberar o despacho do pedido.';});
   const payBtn=document.getElementById('payDemoFee');
   if(payBtn){
    payBtn.textContent='Pagar taxa de R$ 9,90 com PIX';
    let feeTimer=null;
    payBtn.onclick=async function(){
     payBtn.disabled=true;payBtn.textContent='Gerando PIX da taxa...';
     let panel=document.getElementById('feePixPanel');
     if(!panel){
      panel=document.createElement('div');panel.id='feePixPanel';
      panel.style.cssText='padding:18px;text-align:center;border:1px solid #ddd;border-radius:12px;margin:20px 0;background:#fafafa';
      payBtn.parentNode.insertBefore(panel,payBtn.nextSibling);
     }
     panel.hidden=false;panel.replaceChildren();
     try{
      const res=await fetch('/api/pix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'fee',request_id:order.id})});
      const data=await res.json();
      if(!res.ok||!data.transaction)throw new Error(data.error||'Erro ao gerar PIX da taxa');
      const t=data.transaction;
      const title=document.createElement('h3');title.textContent='Pague a taxa de R$ 9,90 via PIX';
      const img=document.createElement('img');img.alt='QR Code PIX';img.style.cssText='width:220px;max-width:100%;display:block;margin:12px auto';
      const qr=t.qr_code_base64||'';
      if(qr&&(/^data:image\/(png|jpeg|webp);base64,/.test(qr)||/^[A-Za-z0-9+/=\s]+$/.test(qr))) img.src=qr.startsWith('data:')?qr:'data:image/png;base64,'+qr;
      else img.hidden=true;
      const code=document.createElement('textarea');code.readOnly=true;code.value=t.pix_copia_cola||'';code.style.cssText='width:100%;height:85px;font-size:13px;padding:8px;border-radius:8px;border:1px solid #ccc;display:block;margin:10px auto';
      const copy=document.createElement('button');copy.type='button';copy.className='button';copy.style.cssText='margin:10px auto;max-width:240px;padding:12px 14px;font-size:14px;background:#bd1421;color:#fff;border-radius:999px';copy.textContent='Copiar código PIX';
      copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Código copiado!';}catch(_){code.focus();code.select();copy.textContent='Selecione e copie';}};
      const statusP=document.createElement('p');statusP.style.cssText='font-weight:700;margin-top:12px;color:#d97706';statusP.textContent='Aguardando pagamento da taxa...';
      panel.append(title,img,code,copy,statusP);
      payBtn.textContent='Mostrar PIX da taxa';payBtn.disabled=false;
      clearInterval(feeTimer);
      feeTimer=setInterval(async()=>{
       try{
        const sRes=await fetch('/api/pix-status?id='+encodeURIComponent(t.id),{headers:{Authorization:'Bearer '+data.access_token}});
        const sData=await sRes.json();
        if(sData?.transaction?.status==='paid'){
         clearInterval(feeTimer);
         statusP.style.color='#168239';statusP.textContent='Taxa confirmada com sucesso! Redirecionando...';
         order.feePaid=true;order.step=0;write(order);
         setTimeout(()=>{location.href='/status.html';},1200);
        }
       }catch(_){}
      },5000);
     }catch(err){
      payBtn.disabled=false;payBtn.textContent='Tentar gerar PIX novamente';
      const errP=document.createElement('p');errP.style.cssText='color:#dc2626;font-size:14px;margin-top:8px';errP.textContent=err.message||'Não foi possível gerar a cobrança da taxa.';
      panel.replaceChildren(errP);
     }
    };
   }
  }else{
   document.getElementById('payDemoFee').onclick=function(){this.disabled=true;order.feePaid=true;order.step=0;write(order);location.href='/status.html';};
  }
 }
 if(page==='status'){
  if(!order.feePaid){location.replace('/taxa.html');return;}
  if(!enabled){
   document.querySelectorAll('.demo').forEach(e=>e.style.display='none');
  }
  const names=['Pedido recebido','Em preparo','Saiu para entrega','Entregue'];
  const render=()=>{document.getElementById('orderStatus').textContent=names[order.step];document.querySelectorAll('[data-status-step]').forEach(e=>{const step=Number(e.dataset.statusStep);e.classList.toggle('done',step<=order.step);e.setAttribute('aria-current',step===order.step?'step':'false');});document.getElementById('nextDemoStatus').disabled=order.step===3;document.getElementById('nextDemoStatus').textContent=order.step===3?'Simulação concluída':'Simular próxima etapa';};
  const list=document.getElementById('orderItems');for(const item of order.items){const li=document.createElement('li');li.textContent=item.quantidade+'× '+item.nome;list.append(li);}
  document.getElementById('nextDemoStatus').onclick=()=>{if(order.step<3){order.step++;write(order);render();}};render();
 }
})();
