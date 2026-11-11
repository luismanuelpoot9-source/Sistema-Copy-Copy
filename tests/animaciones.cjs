const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage();
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/login.html');
    await page.waitForFunction(()=>document.querySelector('.hoja').getAnimations().length>0);
    await page.fill('#usuario','admin'); await page.fill('#clave','incorrecta'); await page.click('button[type="submit"]');
    await page.waitForFunction(()=>document.querySelector('#login-error').getAnimations().length>0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.getAnimations().length===0);
    await page.reload();
    assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    assert.equal(await page.locator('.hoja').isVisible(),true);
    await page.fill('#usuario','admin'); await page.fill('#clave','copycopy123'); await page.click('button[type="submit"]');
    await page.waitForURL('**/panel.html');
    assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
    assert.equal(await page.locator('#resumen article').count(),4);
    assert.deepEqual(errors,[]);
    console.log('OK: entrada animada, aviso animado y movimiento reducido sin ocultar contenido.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
