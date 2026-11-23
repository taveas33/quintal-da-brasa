import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);const read=p=>readFileSync(new URL(p,root),'utf8');
test('usa os 19 pratos e valores do Quintal e preserva os refrigerantes',()=>{const c=JSON.parse(read('data/catalog.json'));assert.equal(c.meusProdutos.filter(p=>!['bebidas','alcoolicas'].includes(p.categoria)).length,19);assert.equal(c.meusProdutos.find(p=>p.nome==='Quentinha de Bife Acebolado').preco,18.9);assert.equal(c.meusProdutos.find(p=>p.id==='coca-2l').preco,8.99);assert.equal(c.meusProdutos.find(p=>p.id==='coca-350ml').preco,3.5);});
test('HTML usa logo e rodapé Quintal sem marcas antigas',()=>{const s=read('public/index.html');assert.match(s,/Quintal da Brasa/);assert.match(s,/BGR LTDA/);assert.doesNotMatch(s,/Sul na Brasa|Assados do Pampa|37\.XXX/);assert.ok(existsSync(new URL('public/images/logo.png',root)));});
test('env vazio fora do público e funções Vercel presentes',()=>{assert.match(read('.env'),/^NEXUSPAG_API_KEY=$/m);assert.ok(!existsSync(new URL('public/.env',root)));assert.ok(existsSync(new URL('api/pix.js',root)));assert.match(read('.gitignore'),/\.env/);});
test('fluxo de teste informa taxa antes de simular e oferece status sem cobranças',()=>{
 assert.match(read('public/checkout.html'),/Taxa de embalagem e transporte/);
 assert.match(read('public/taxa.html'),/R\$ 9,90/);
 assert.match(read('public/taxa.html'),/Pagamento inicial simulado/);
 assert.match(read('public/status.html'),/Status do pedido/);
 assert.doesNotMatch(read('public/taxa.html'),/exigência legal|90 dias|1234\/XYZ/);
});
