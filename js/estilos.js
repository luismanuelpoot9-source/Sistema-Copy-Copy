// Efectos visuales compartidos. No modifica productos, ventas ni sesiones.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  function animate(element, frames, options = {}) {
    if (!element || element.hidden || reduced.matches || !element.animate) return;
    running.get(element)?.cancel();
    const effect = element.animate(frames, {
      duration: 480,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      ...options
    });
    running.set(element, effect);
    const cleanup = () => { if (running.get(element) === effect) running.delete(element); };
    effect.onfinish = cleanup;
    effect.oncancel = cleanup;
  }

  // Entrada escalonada al abrir cada pantalla y al descubrir sus secciones.
  const cards = document.querySelectorAll('.hoja, main > h1, main > section, .resumen article, .accesos-menu a');
  animate(document.querySelector('.barra-principal'), [
    { opacity: 0, transform: 'translateY(-16px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ]);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        animate(entry.target, [
          { opacity: 0, transform: 'translateY(24px) scale(.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 620, delay: Math.min(index * 85, 340), fill: 'backwards' });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    cards.forEach(card => observer.observe(card));
  }

  // Delegación para incluir los botones generados al editar o filtrar tablas.
  document.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control || control.disabled) return;
    animate(control, [
      { transform: 'scale(1)' },
      { transform: 'scale(.94)', offset: .35 },
      { transform: 'scale(1)' }
    ], { duration: 260 });
  });

  // Animar cada actualización, incluso cuando se repite el mismo aviso.
  ['mensaje', 'login-error', 'total', 'cambio', 'carrito', 'resultados', 'productos', 'ticket-detalle'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    new MutationObserver(() => {
      const error = element.classList.contains('error') || id === 'login-error';
      const frames = error ? [
        { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
        { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' }
      ] : [
        { opacity: .4, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ];
      animate(element, frames, { duration: 380 });
    }).observe(element, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  });

  reduced.addEventListener('change', () => {
    if (reduced.matches) running.forEach(effect => effect.cancel());
  });
  addEventListener('beforeprint', () => running.forEach(effect => effect.cancel()));
})();
