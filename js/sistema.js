(() => {
  'use strict';
  if (document.body.hidden || !document.querySelector('#mensaje')) return;
  const $ = s => document.querySelector(s);
  const key = 'copycopy.datos.v1';
  const money = n => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN'}).format(n / 100);
  const day = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const message = (text, error = false) => { $('#mensaje').textContent=text; $('#mensaje').hidden=false; $('#mensaje').classList.toggle('error',error); };
  let db;
  try {
    const saved = localStorage.getItem(key);
    db = saved ? JSON.parse(saved) : {products:window.PRODUCTOS_INICIALES, sales:[]};
    if (!Array.isArray(db.products) || !Array.isArray(db.sales)) throw new Error();
    if (!saved) localStorage.setItem(key, JSON.stringify(db));
  } catch { message('No se pudieron cargar los datos. Revisa el almacenamiento del navegador; no se sobrescribieron los datos existentes.', true); return; }
  function save(next) {
    try { localStorage.setItem(key,JSON.stringify(next)); db=next; return true; }
    catch { message('No se pudieron guardar los cambios. Revisa el espacio y los permisos del navegador.',true); return false; }
  }
  function table(target, headers, rows) {
    const host = $(target); host.replaceChildren();
    if (!rows.length) { const p=document.createElement('p'); p.textContent='No hay registros para mostrar.'; host.append(p); return; }
    const t=document.createElement('table'), head=t.createTHead().insertRow(), body=t.createTBody();
    headers.forEach(text=>{ const th=document.createElement('th'); th.scope='col'; th.textContent=text; head.append(th); });
    rows.forEach(row=>{ const tr=body.insertRow(); row.forEach(value=>{ const td=tr.insertCell(); value instanceof Node ? td.append(value) : td.textContent=String(value); }); });
    host.append(t);
  }
  function button(text, action, label=text) { const b=document.createElement('button'); b.type='button'; b.textContent=text; b.setAttribute('aria-label',label); b.addEventListener('click',action); return b; }
  const page=document.body.dataset.page;
  function summary() {
    const today=db.sales.filter(s=>s.date===day());
    const entries=[['Ventas de hoy', money(today.reduce((n,s)=>n+s.total,0))],['Unidades vendidas hoy',today.reduce((n,s)=>n+s.items.reduce((v,i)=>v+i.qty,0),0)],['Productos en catálogo',db.products.length],['Existencias bajas (menos de 10)',db.products.filter(p=>p.stock<10).length]];
    $('#resumen').replaceChildren(...entries.map(([label,value])=>{ const a=document.createElement('article'); const h=document.createElement('h2'); h.textContent=label; const p=document.createElement('p'); p.textContent=value; a.append(h,p); return a; }));
  }
  if(page==='panel') {
    summary(); table('#ultimas',['Folio','Fecha','Total'],db.sales.slice(-10).reverse().map(s=>[s.id,new Date(s.created).toLocaleString('es-MX'),money(s.total)]));
    table('#stock-bajo',['Producto','Existencias'],db.products.filter(p=>p.stock<10).map(p=>[p.name,p.stock]));
  }
  if(page==='inventario') {
    let editing=null;
    function reset() { editing=null; $('#product-form').reset(); $('#codigo').readOnly=false; $('#form-title').textContent='Agregar producto'; $('#cancelar-edicion').hidden=true; }
    function render() {
      const term=$('#search-input').value.toLocaleLowerCase();
      const products=db.products.filter(p=>(!$('#solo-favoritos').checked || p.favorite) && `${p.code} ${p.name} ${p.category}`.toLocaleLowerCase().includes(term));
      table('#productos',['Código','Nombre','Categoría','Existencias','Precio','Estado','Favorito','Acciones'],products.map(p=>{
        const actions=document.createElement('div');
        actions.append(button('Editar',()=>{
          editing=p.code; $('#codigo').value=p.code; $('#codigo').readOnly=true; $('#nombre').value=p.name; $('#categoria').value=p.category; $('#unidades').value=p.stock; $('#precio').value=(p.price/100).toFixed(2); $('#form-title').textContent='Editar producto'; $('#cancelar-edicion').hidden=false; $('#nombre').focus();
        }),button('Eliminar',()=>{ if(confirm(`¿Eliminar ${p.name} del inventario? Las ventas registradas se conservarán.`)) { const next=structuredClone(db); next.products=next.products.filter(x=>x.code!==p.code); if(save(next)) { if(editing===p.code) reset(); render(); message('Producto eliminado.'); } } }));
        return [p.code,p.name,p.category,p.stock,p.price?money(p.price):'Sin precio',p.stock===0?'Agotado':p.stock<10?'Existencias bajas':'Disponible',button(p.favorite?'★':'☆',()=>{const next=structuredClone(db); next.products.find(x=>x.code===p.code).favorite=!p.favorite; if(save(next)) render();},`Cambiar favorito: ${p.name}`),actions];
      }));
    }
    $('#product-form').addEventListener('submit',event=>{
      event.preventDefault();
      const p={code:$('#codigo').value.trim().toUpperCase(),name:$('#nombre').value.trim(),category:$('#categoria').value.trim(),stock:Number($('#unidades').value),price:Math.round(Number($('#precio').value)*100),favorite:false};
      if(!p.code||!p.name||!p.category||!Number.isSafeInteger(p.stock)||p.stock<0||p.stock>1000000||!Number.isSafeInteger(p.price)||p.price<=0||p.price>100000000) {message('Completa los campos con existencias enteras y un precio válido.',true);return;}
      if(!editing && db.products.some(x=>x.code===p.code)) {message('Ese código ya existe. Usa Editar para modificarlo.',true);return;}
      const next=structuredClone(db);
      if(editing) {const i=next.products.findIndex(x=>x.code===editing); p.favorite=next.products[i].favorite; next.products[i]=p;} else next.products.push(p);
      if(save(next)) {reset();render();message('Producto guardado.');}
    });
    $('#cancelar-edicion').addEventListener('click',reset); $('#search-input').addEventListener('input',render); $('#solo-favoritos').addEventListener('change',render); render();
  }
  if(page==='ventas') {
    let cart=[];
    const total=()=>cart.reduce((n,i)=>n+i.price*i.qty,0);
    function change() {$('#cambio').textContent=money(Math.max(0,Math.round(Number($('#pago').value)*100)-total()));}
    function render() {
      const selected=$('#producto').value;
      $('#producto').replaceChildren(new Option('Selecciona un producto',''));
      db.products.filter(p=>p.stock>0&&p.price>0).forEach(p=>$('#producto').add(new Option(`${p.code} · ${p.name} · ${money(p.price)} · ${p.stock} disponibles`,p.code)));
      $('#producto').value=selected;
      table('#carrito',['Producto','Cantidad','Precio','Importe','Acciones'],cart.map(i=>[i.name,i.qty,money(i.price),money(i.price*i.qty),button('Quitar',()=>{cart=cart.filter(x=>x.code!==i.code);render();})]));
      $('#total').textContent=money(total()); $('#cobrar').disabled=!cart.length; change();
    }
    $('#sale-form').addEventListener('submit',e=>{e.preventDefault(); const p=db.products.find(p=>p.code===$('#producto').value), qty=Number($('#cantidad').value), item=cart.find(i=>i.code===p?.code);
      if(!p||!Number.isSafeInteger(qty)||qty<1||qty+(item?.qty||0)>p.stock) {message('La cantidad supera las existencias disponibles o no es válida.',true);return;}
      if(item) item.qty+=qty; else cart.push({code:p.code,name:p.name,price:p.price,qty});
      render();message('Producto agregado al carrito.');
    });
    $('#pago').addEventListener('input',change);
    $('#vaciar').addEventListener('click',()=>{cart=[];$('#checkout-form').reset();render();});
    $('#checkout-form').addEventListener('submit',e=>{
      e.preventDefault(); const payment=Math.round(Number($('#pago').value)*100);
      if(!cart.length||!Number.isSafeInteger(payment)||payment<total()) {message('El pago debe cubrir el total de la venta.',true);return;}
      // Leer otra vez para evitar descontar sobre existencias antiguas.
      let next; try {next=JSON.parse(localStorage.getItem(key));} catch {message('No se pudieron leer las existencias.',true);return;}
      if(!next || cart.some(i=>{const p=next.products.find(p=>p.code===i.code); return !p||p.stock<i.qty||p.price!==i.price;})) {message('Cambió el precio o las existencias. Recarga la página y revisa el carrito.',true);return;}
      const sale={id:`V-${String(next.sales.length+1).padStart(6,'0')}`,created:new Date().toISOString(),date:day(),items:structuredClone(cart),total:total(),payment,change:payment-total()};
      cart.forEach(i=>next.products.find(p=>p.code===i.code).stock-=i.qty); next.sales.push(sale);
      if(!save(next)) return;
      $('#ticket').hidden=false; table('#ticket-detalle',['Concepto','Detalle'],[['Folio',sale.id],['Fecha',new Date(sale.created).toLocaleString('es-MX')],...sale.items.map(i=>[`${i.qty} × ${i.name}`,money(i.qty*i.price)]),['Total',money(sale.total)],['Pago',money(payment)],['Cambio',money(sale.change)]]);
      cart=[]; $('#checkout-form').reset(); render();message('Venta registrada y existencias actualizadas.');
    });
    $('#imprimir-ticket').addEventListener('click',()=>window.print()); render();
  }
  if(page==='reportes') {
    let exported=[];
    summary();
    function report() {
      const type=$('#tipo').value, from=$('#fechaInicio').value, to=$('#fechaFin').value;
      if(type!=='inventario'&&from&&to&&from>to) {message('La fecha inicial no puede ser posterior a la final.',true);return false;}
      const sales=db.sales.filter(s=>(!from||s.date>=from)&&(!to||s.date<=to));
      let headers, rows;
      if(type==='inventario') {headers=['Código','Producto','Categoría','Existencias','Precio MXN'];rows=db.products.map(p=>[p.code,p.name,p.category,p.stock,(p.price/100).toFixed(2)]);}
      else if(type==='productos') {
        const totals=new Map(); sales.forEach(s=>s.items.forEach(i=>{const p=totals.get(i.code)||{code:i.code,name:i.name,qty:0,total:0};p.qty+=i.qty;p.total+=i.qty*i.price;totals.set(i.code,p);}));
        headers=['Código','Producto','Unidades vendidas','Importe MXN']; rows=[...totals.values()].map(p=>[p.code,p.name,p.qty,(p.total/100).toFixed(2)]);
      } else {headers=['Folio','Fecha','Unidades','Total MXN']; rows=sales.map(s=>[s.id,s.date,s.items.reduce((n,i)=>n+i.qty,0),(s.total/100).toFixed(2)]);}
      exported=[headers,...rows]; $('#reporte-titulo').textContent=$('#tipo').selectedOptions[0].textContent;
      $('#reporte-periodo').textContent=type==='inventario'?`Inventario al ${day()}`:`Desde ${from||'el primer registro'} hasta ${to||'el último registro'}`;
      table('#resultados',headers,rows);return true;
    }
    $('#report-form').addEventListener('submit',e=>{e.preventDefault();report();});
    $('#report-form').addEventListener('reset',()=>setTimeout(report,0));
    $('#imprimir').addEventListener('click',()=>{if(report()) window.print();});
    $('#exportar').addEventListener('click',()=>{
      if(!report()) return;
      const csv='\uFEFF'+exported.map(row=>row.map(value=>{let s=String(value);if(/^[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})), a=document.createElement('a');a.href=url;a.download=`copycopy-${$('#tipo').value}-${day()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }); report();
  }
  // Si otra pestaña cambia datos, recargar antes de permitir otra escritura.
  addEventListener('storage',event=>{if(event.key===key){message('Los datos cambiaron en otra pestaña. Recarga esta página para continuar.',true);document.querySelectorAll('main button, main input, main select').forEach(el=>el.disabled=true);}});
})();
