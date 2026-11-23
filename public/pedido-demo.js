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
 if(!enabled||!order?.initialPaid){location.replace('/checkout.html');return;}
 document.querySelectorAll('[data-order-id]').forEach(e=>e.textContent=order.id.slice(0,8).toUpperCase());
 document.querySelectorAll('[data-order-total]').forEach(e=>e.textContent=money(order.total));
 document.querySelectorAll('[data-order-subtotal]').forEach(e=>e.textContent=money(order.subtotal));
 if(page==='fee'){
  if(order.feePaid){location.replace('/status.html');return;}
  document.getElementById('payDemoFee').onclick=function(){this.disabled=true;order.feePaid=true;order.step=0;write(order);location.href='/status.html';};
 }
 if(page==='status'){
  if(!order.feePaid){location.replace('/taxa.html');return;}
  const names=['Pedido recebido','Em preparo','Saiu para entrega','Entregue'];
  const render=()=>{document.getElementById('orderStatus').textContent=names[order.step];document.querySelectorAll('[data-status-step]').forEach(e=>{const step=Number(e.dataset.statusStep);e.classList.toggle('done',step<=order.step);e.setAttribute('aria-current',step===order.step?'step':'false');});document.getElementById('nextDemoStatus').disabled=order.step===3;document.getElementById('nextDemoStatus').textContent=order.step===3?'Simulação concluída':'Simular próxima etapa';};
  const list=document.getElementById('orderItems');for(const item of order.items){const li=document.createElement('li');li.textContent=item.quantidade+'× '+item.nome;list.append(li);}
  document.getElementById('nextDemoStatus').onclick=()=>{if(order.step<3){order.step++;write(order);render();}};render();
 }
})();
