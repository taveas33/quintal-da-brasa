import fs from 'node:fs';
import catalog from '../data/catalog.json' with {type:'json'};
const output=Object.entries(catalog).map(([key,value])=>'const '+key+' = '+JSON.stringify(value,null,2)+';').join('\n\n');
fs.writeFileSync(new URL('../public/product.js',import.meta.url),output+'\nfunction encontrarProdutoPorId(id){return meusProdutos.find(p=>p.id===id); }\n');
console.log('Catálogo gerado:',catalog.meusProdutos.length,'produtos.');

const mode=process.env.PIX_MODE==='live'?'live':'demo';
fs.writeFileSync(new URL('../public/payment-config.js',import.meta.url),'window.QUINTAL_PAYMENT_MODE = '+JSON.stringify(mode)+';\n');
console.log('Pagamento:',mode);
