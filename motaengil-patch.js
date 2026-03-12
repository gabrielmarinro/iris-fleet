/*  =============================================
    IRSFLT — Mota-Engil Fleet Toggle Patch
    Cambio #2: Toggle Ligeros / Pesados / Todos
    Solo aplica a empresa "motaengil" en Atención Crítica
    NO modifica Bimbo ni Idealease
    =============================================  */

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  const POLL_MS   = 800;   // ms between DOM polls
  const MAX_POLLS = 120;   // stop after ~96 s
  let   polls     = 0;
  let   currentFilter = 'todos';  // 'ligeros' | 'pesados' | 'todos'
  let   toggleInjected = false;

  // ── Detect active company ──────────────────────────────
  function activeCompany () {
    // The company selector pills at the top
    const active = document.querySelector('[class*="bg-gradient-to-r"][class*="shadow"]');
    if (!active) return null;
    const txt = (active.textContent || '').trim().toLowerCase();
    if (txt.includes('mota'))   return 'motaengil';
    if (txt.includes('bimbo'))  return 'bimbo';
    if (txt.includes('ideal'))  return 'idealease';
    return null;
  }

  // ── Detect if we're on Atención Crítica tab ────────────
  function isAtencionCritica () {
    // Check for active tab containing "Atención" or "Critica"
    const tabs = document.querySelectorAll('button, [role="tab"]');
    for (const t of tabs) {
      const txt = (t.textContent || '').toLowerCase();
      if ((txt.includes('atención') || txt.includes('atencion') || txt.includes('crítica') || txt.includes('critica')) &&
          (t.classList.contains('border-b-2') || t.classList.contains('text-blue-600') ||
           t.getAttribute('aria-selected') === 'true' ||
           window.getComputedStyle(t).borderBottomWidth === '2px')) {
        return true;
      }
    }
    return false;
  }

  // ── Build toggle bar ───────────────────────────────────
  function createToggle () {
    const bar = document.createElement('div');
    bar.id = 'iris-fleet-toggle';
    bar.className = 'flex items-center justify-center gap-2 my-3';
    bar.style.cssText = 'position:relative;z-index:40;';

    const btns = [
      { key: 'ligeros',  label: '🚗 Ligeros',  bg: 'bg-blue-600'   },
      { key: 'pesados',  label: '🚜 Pesados',  bg: 'bg-orange-600' },
      { key: 'todos',    label: '📊 Todos',     bg: 'bg-indigo-600' },
    ];

    btns.forEach(b => {
      const el = document.createElement('button');
      el.dataset.fleet = b.key;
      el.textContent = b.label;
      el.className = currentFilter === b.key
        ? `${b.bg} text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition`
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition';
      el.addEventListener('click', () => {
        currentFilter = b.key;
        applyFilter();
        refreshToggleStyles();
      });
      bar.appendChild(el);
    });
    return bar;
  }

  function refreshToggleStyles () {
    const bar = document.getElementById('iris-fleet-toggle');
    if (!bar) return;
    const map = { ligeros: 'bg-blue-600', pesados: 'bg-orange-600', todos: 'bg-indigo-600' };
    bar.querySelectorAll('button').forEach(btn => {
      const k = btn.dataset.fleet;
      btn.className = currentFilter === k
        ? `${map[k]} text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition`
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition';
    });
  }

  // ── Apply filter to table rows ─────────────────────────
  function applyFilter () {
    const tables = document.querySelectorAll('table');
    tables.forEach(tbl => {
      const rows = tbl.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const unitCell  = row.querySelector('td:nth-child(2)');
        const typeCell  = row.querySelector('td:nth-child(3)');
        if (!unitCell || !typeCell) return;

        const unit = (unitCell.textContent || '').trim();
        const type = (typeCell.textContent || '').trim().toLowerCase();

        // Determine if this is a heavy-equipment event
        const isPesado = unit.startsWith('ME-EX') || unit.startsWith('ME-VQ') ||
                         unit.startsWith('ME-GR') || unit.startsWith('ME-BZ') ||
                         unit.startsWith('ME-CG') ||
                         type.includes('volcadura') || type.includes('ordeña') ||
                         type.includes('sobrecarga') || type.includes('microsueño') ||
                         type.includes('proximidad') || type.includes('ralentí') ||
                         type.includes('tpms') || type.includes('vibración') ||
                         type.includes('hidráulico');

        const isLigero = !isPesado;

        if (currentFilter === 'todos') {
          row.style.display = '';
        } else if (currentFilter === 'pesados') {
          row.style.display = isPesado ? '' : 'none';
        } else {
          row.style.display = isLigero ? '' : 'none';
        }
      });
    });

    // Update the "Iris analizó" text
    updateIrisText();
    // Update the severity counters
    updateSeverityCounters();
  }

  // ── Update "Iris analizó" narrative ────────────────────
  function updateIrisText () {
    const texts = {
      ligeros: '🎙️ Iris analizó <strong>847 eventos de vehículos ligeros</strong> y determinó que solo <strong class="text-blue-700">15</strong> requieren atención directa.',
      pesados: '🎙️ Iris analizó <strong>312 eventos de maquinaria pesada</strong> y determinó que solo <strong class="text-blue-700">8</strong> requieren atención directa.',
      todos:   '🎙️ Iris analizó <strong>1,159 eventos (847 ligeros + 312 pesados)</strong> y determinó que solo <strong class="text-blue-700">23</strong> requieren atención directa.',
    };
    // Find the Iris bubble (look for text containing "Iris analizó")
    const allP = document.querySelectorAll('p');
    allP.forEach(p => {
      if (p.textContent && p.textContent.includes('Iris analiz') && p.textContent.includes('eventos')) {
        p.innerHTML = texts[currentFilter] || texts.todos;
      }
    });
  }

  // ── Update severity counters (critico/moderado/bajo) ──
  function updateSeverityCounters () {
    const tables = document.querySelectorAll('table');
    tables.forEach(tbl => {
      const rows = tbl.querySelectorAll('tbody tr');
      let visible = 0;
      rows.forEach(r => { if (r.style.display !== 'none') visible++; });

      // Find the 3-column grid with severity boxes near this table
      const parent = tbl.closest('div[class*="space-y"]') || tbl.parentElement?.parentElement;
      if (!parent) return;
      const boxes = parent.querySelectorAll('[class*="bg-red-50"], [class*="bg-amber-50"], [class*="bg-green-50"]');
      if (boxes.length < 3) return;

      // Count severity from visible rows
      let crit = 0, mod = 0, bajo = 0;
      rows.forEach(r => {
        if (r.style.display === 'none') return;
        const priorityCell = r.querySelector('td:first-child');
        if (!priorityCell) return;
        const p = parseInt(priorityCell.textContent, 10);
        if (p >= 88) crit++;
        else if (p >= 75) mod++;
        else bajo++;
      });

      const updateBox = (box, count, total) => {
        const bigNum = box.querySelector('[class*="text-xl"]');
        if (bigNum) bigNum.textContent = count + '/' + total;
        const pct = box.querySelector('[class*="text-xs"][class*="font-semibold"]:last-child');
        if (pct && total > 0) pct.textContent = (count / total * 100).toFixed(1) + '%';
      };

      updateBox(boxes[0], crit, visible);
      updateBox(boxes[1], mod, visible);
      updateBox(boxes[2], bajo, visible);
    });
  }

  // ── Main injection loop ────────────────────────────────
  function tick () {
    polls++;
    if (polls > MAX_POLLS) return;

    const company = activeCompany();
    const onAC    = isAtencionCritica();

    // Remove toggle if we left motaengil or Atención Crítica
    if (company !== 'motaengil' || !onAC) {
      const old = document.getElementById('iris-fleet-toggle');
      if (old) old.remove();
      toggleInjected = false;
      currentFilter = 'todos';
      // Show all rows again
      document.querySelectorAll('table tbody tr').forEach(r => r.style.display = '');
      setTimeout(tick, POLL_MS);
      return;
    }

    // Inject toggle if not yet done
    if (!toggleInjected) {
      // Find the table in Atención Crítica
      const tbl = document.querySelector('table');
      if (tbl) {
        const wrapper = tbl.closest('[class*="overflow"]') || tbl.parentElement;
        if (wrapper && !document.getElementById('iris-fleet-toggle')) {
          const toggle = createToggle();
          wrapper.parentElement.insertBefore(toggle, wrapper);
          toggleInjected = true;
          applyFilter();
        }
      }
    }

    setTimeout(tick, POLL_MS);
  }

  // ── Watch for navigation / tab changes ─────────────────
  const observer = new MutationObserver(() => {
    const company = activeCompany();
    const onAC    = isAtencionCritica();
    if (company !== 'motaengil' || !onAC) {
      const old = document.getElementById('iris-fleet-toggle');
      if (old) old.remove();
      toggleInjected = false;
      currentFilter = 'todos';
      document.querySelectorAll('table tbody tr').forEach(r => r.style.display = '');
    } else if (!toggleInjected) {
      // Re-try injection after tab switch
      setTimeout(() => {
        const tbl = document.querySelector('table');
        if (tbl) {
          const wrapper = tbl.closest('[class*="overflow"]') || tbl.parentElement;
          if (wrapper && !document.getElementById('iris-fleet-toggle')) {
            const toggle = createToggle();
            wrapper.parentElement.insertBefore(toggle, wrapper);
            toggleInjected = true;
            applyFilter();
          }
        }
      }, 500);
    }
  });

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
      setTimeout(tick, 2000); // wait for React to render
    });
  } else {
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    setTimeout(tick, 2000);
  }
})();
