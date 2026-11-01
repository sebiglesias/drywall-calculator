(() => {
  'use strict';

  const state = {
    mode: 'partition', // 'partition' (2 sides) | 'single' (1 side) | 'ceiling'
    length: 13, // feet
    height: 8,  // feet
    openingsSqFt: 21,
    sheetSqFt: 32, // 32 for 4x8, 48 for 4x12
    studSpacingInches: 16,
    wastePct: 0.10,
    drywallType: 'std'
  };

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function calculate() {
    // Gross area
    const wallFaceArea = Math.max(1, (state.length * state.height) - state.openingsSqFt);
    const multiplier = state.mode === 'partition' ? 2 : 1;
    const totalDrywallArea = wallFaceArea * multiplier;
    const totalWithWaste = totalDrywallArea * (1 + state.wastePct);

    // Number of sheets
    const sheetsCount = Math.ceil(totalWithWaste / state.sheetSqFt);

    // Framing studs (if vertical partition or wall)
    let studsCount = 0;
    let trackFeet = 0;
    if (state.mode === 'ceiling') {
      // Ceiling joists or furring channels spaced 16" OC
      const furringRuns = Math.ceil((state.height * 12) / state.studSpacingInches) + 1;
      studsCount = Math.ceil((furringRuns * state.length) / 10); // 10ft furring strips
      trackFeet = (state.length + state.height) * 2;
    } else {
      // Studs at 16" or 24" OC: (Length in inches / spacing) + 1 + corner studs
      const studsAlongLength = Math.ceil((state.length * 12) / state.studSpacingInches) + 1;
      studsCount = studsAlongLength + 2; // extra for corners / framing
      trackFeet = Math.ceil(state.length * 2); // top plate and bottom runner
    }

    // Joint Compound Mud: ~0.05 gallons per sq ft (or ~1 bucket per 500 sq ft)
    const mudGallons = Math.max(1, Math.round((totalDrywallArea / 100) * 10) / 10);
    const mudBuckets = Math.max(1, Math.ceil(mudGallons / 4.5));

    // Drywall Screws: ~30-36 screws per 4x8 sheet (~1 lb per 300-400 sq ft)
    const totalScrews = sheetsCount * 36;
    const screwLbs = Math.max(1, Math.ceil(totalScrews / 300));

    // Joint Tape: ~1 roll (250 ft or 500 ft)
    const jointLengthFeet = sheetsCount * 12;
    const tapeRolls = Math.max(1, Math.ceil(jointLengthFeet / 250));

    return {
      totalDrywallArea: Math.round(totalDrywallArea),
      totalWithWaste: Math.round(totalWithWaste),
      sheetsCount,
      studsCount,
      trackFeet,
      mudGallons,
      mudBuckets,
      screwLbs,
      totalScrews,
      tapeRolls
    };
  }

  function render() {
    const res = calculate();

    $('#metricArea').textContent = res.totalWithWaste;
    $('#metricSheets').textContent = res.sheetsCount;
    $('#metricSheetSize').textContent = state.sheetSqFt === 32 ? "Standard 4' x 8' sheets" : "Pro 4' x 12' sheets";

    const typeDesc = {
      std: "1/2\" Regular Sheetrock Panels",
      moisture: "1/2\" Moisture-Resistant Greenboard Panels",
      fire: "5/8\" Firecode Type-X Panels"
    }[state.drywallType];

    const materialsEl = $('#materialsList');
    materialsEl.innerHTML = `
      <div class="material-card">
        <div class="mat-left">
          <span class="mat-title">📦 ${typeDesc}</span>
          <span class="mat-sub">${state.sheetSqFt === 32 ? "4' x 8' (32 sq ft/sheet)" : "4' x 12' (48 sq ft/sheet)"} · Includes ${Math.round(state.wastePct * 100)}% cut waste</span>
        </div>
        <span class="mat-qty">${res.sheetsCount} sheets</span>
      </div>

      <div class="material-card">
        <div class="mat-left">
          <span class="mat-title">🪵 Framing Studs (${state.studSpacingInches}" On-Center)</span>
          <span class="mat-sub">2x4 Wood Studs or 25-gauge Metal Studs (${state.height} ft height)</span>
        </div>
        <span class="mat-qty">${res.studsCount} studs</span>
      </div>

      <div class="material-card">
        <div class="mat-left">
          <span class="mat-title">🪣 Ready-Mix Joint Compound (Mud)</span>
          <span class="mat-sub">All-Purpose or Lightweight Taping Compound (~${res.mudGallons} gallons total)</span>
        </div>
        <span class="mat-qty">${res.mudBuckets} bucket${res.mudBuckets > 1 ? 's' : ''} (4.5 gal)</span>
      </div>

      <div class="material-card">
        <div class="mat-left">
          <span class="mat-title">🔩 1-1/4" Coarse Thread Drywall Screws</span>
          <span class="mat-sub">Bugle head phillips screws (~${res.totalScrews} screws)</span>
        </div>
        <span class="mat-qty">${res.screwLbs} lb box</span>
      </div>

      <div class="material-card">
        <div class="mat-left">
          <span class="mat-title">📜 Paper / Fiberglass Mesh Joint Tape</span>
          <span class="mat-sub">Standard 250-foot rolls for flat seams and inside corners</span>
        </div>
        <span class="mat-qty">${res.tapeRolls} roll${res.tapeRolls > 1 ? 's' : ''}</span>
      </div>
    `;
  }

  // Bind Events
  document.addEventListener('DOMContentLoaded', () => {
    $$('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        if (state.mode === 'ceiling') {
          $('#labelLength').textContent = 'Room Length (Feet)';
          $('#labelHeight').textContent = 'Room Width (Feet)';
        } else {
          $('#labelLength').textContent = 'Wall Length (Feet)';
          $('#labelHeight').textContent = 'Wall Height (Feet)';
        }
        render();
      };
    });

    $('#inputLength').oninput = e => { state.length = parseFloat(e.target.value) || 1; render(); };
    $('#inputHeight').oninput = e => { state.height = parseFloat(e.target.value) || 1; render(); };
    $('#inputOpenings').oninput = e => { state.openingsSqFt = parseFloat(e.target.value) || 0; render(); };
    $('#selectSheetSize').onchange = e => { state.sheetSqFt = parseInt(e.target.value, 10); render(); };
    $('#selectStudSpacing').onchange = e => { state.studSpacingInches = parseInt(e.target.value, 10); render(); };
    $('#selectWaste').onchange = e => { state.wastePct = parseFloat(e.target.value); render(); };
    $('#selectDrywallType').onchange = e => { state.drywallType = e.target.value; render(); };

    $('#btnCopyMaterials').onclick = () => {
      const res = calculate();
      const btn = $('#btnCopyMaterials');
      const text = `Drywall Renovation Shopping List:
• Drywall Sheets (${state.sheetSqFt === 32 ? "4x8 ft" : "4x12 ft"}): ${res.sheetsCount} sheets
• Framing Studs (${state.studSpacingInches}" OC): ${res.studsCount} studs
• Joint Compound Mud: ${res.mudBuckets} bucket(s) (4.5 gal)
• Drywall Screws (1-1/4"): ${res.screwLbs} lb box
• Joint Tape: ${res.tapeRolls} roll(s) (250 ft)
Total Wall Surface: ~${res.totalWithWaste} sq ft (with ${Math.round(state.wastePct * 100)}% waste)

Calculated with: https://sebiglesias.com.ar/drywall-calculator/`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<span>✅</span> Shopping List Copied to Clipboard!';
          btn.style.background = '#059669';
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = '';
          }, 2500);
        });
      }
    };

    render();
  });
})();
