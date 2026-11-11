const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:8765/';
  await page.goto(base+'ventas.html');
  await page.waitForURL('**/login.html');
  assert.equal(await page.locator('nav').count(),0);
  await page.fill('#usuario','admin'); await page.fill('#clave','wrong'); await page.click('button[type=submit]');
  assert.equal(await page.locator('#login-error').isVisible(),true);
  await page.fill('#clave','copycopy123'); await page.click('button[type=submit]'); await page.waitForURL('**/panel.html');
  assert.equal(await page.getByText('Iniciar sesión',{exact:true}).count(),0);
  await page.click('nav a[href="inventario.html"]');
  await page.fill('#codigo','TEST-001'); await page.fill('#nombre','Producto de prueba'); await page.fill('#categoria','Pruebas'); await page.fill('#unidades','5'); await page.fill('#precio','12.50'); await page.click('#product-form button[type="submit"]');
  await page.reload(); await page.fill('#search-input','TEST-001'); assert.equal(await page.locator('#productos tbody tr').count(),1);
  await page.locator('#productos').getByRole('button',{name:'Editar',exact:true}).click(); await page.fill('#precio','15.50'); await page.click('#product-form button[type="submit"]');
  await page.click('nav a[href="ventas.html"]'); await page.selectOption('#producto','TEST-001'); await page.fill('#cantidad','6'); await page.click('#sale-form button');
  assert.match(await page.locator('#mensaje').textContent(),/supera/);
  await page.fill('#cantidad','2'); await page.click('#sale-form button'); await page.fill('#pago','10'); await page.click('#cobrar');
  assert.match(await page.locator('#mensaje').textContent(),/cubrir/);
  await page.fill('#pago','50'); await page.click('#cobrar'); assert.equal(await page.locator('#ticket').isVisible(),true);
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('copycopy.datos.v1')));
  assert.equal(data.products.find(p=>p.code==='TEST-001').stock,3); assert.equal(data.sales[0].total,3100); assert.equal(data.sales[0].change,1900);
  await page.click('nav a[href="reportes.html"]'); assert.match(await page.locator('#resultados').textContent(),/31.00/);
  await page.selectOption('#tipo','productos'); await page.click('#report-form button[type="submit"]'); assert.match(await page.locator('#resultados').textContent(),/TEST-001/);
  const download=page.waitForEvent('download'); await page.click('#exportar'); assert.match((await download).suggestedFilename(),/\.csv$/);
  await page.fill('#fechaInicio','2099-01-01'); await page.click('#report-form button[type="submit"]'); assert.match(await page.locator('#resultados').textContent(),/No hay registros/);
  for(const width of [390,1280]) {
    await page.setViewportSize({width,height:900});
    for(const name of ['panel','menu','inventario','ventas','reportes']) {
      await page.goto(base+name+'.html');
      assert.equal(await page.locator('nav a[aria-current="page"]').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} overflow at ${width}`);
    }
  }
  await page.click('#cerrar-sesion'); await page.waitForURL('**/login.html'); await page.goto(base+'inventario.html'); await page.waitForURL('**/login.html');
  assert.deepEqual(errors,[]); console.log('OK: login, sesión, CRUD, validación de stock/pago, venta, reportes, exportación, navegación y móvil.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
