/* =========================================================
   StadiumGo — Smart Stadium Experience System
   Interactive JavaScript — Animations, Live Simulations
   ========================================================= */

"use strict";

/* ====================  GLOBAL STATE  ==================== */
const state = {
  ticketValid: false,
  routeCount: 1284,
  eventsPerSec: 12847,
  sensorTick: 0,
  heatmapData: null,
};

/* ====================  DOM HELPERS  ==================== */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* ====================  NAV ACTIVE  ==================== */
function initNav() {
  const sections = ['attendees', 'intelligence', 'operations', 'coordination'];
  const links = $$('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        const active = $(`[data-section="${entry.target.id}"]`);
        if (active) {
          active.classList.add('active');
          active.setAttribute('aria-current', 'section');
        }
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      // Close mobile menu before scrolling
      hamburger.classList.remove('open');
      navLinksEl.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      scrollToSection(section);
    });
  });

  // ── Hamburger toggle ────────────────────────────────────────────
  const hamburger   = document.getElementById('nav-hamburger');
  const navLinksEl  = document.getElementById('nav-links-list');
  if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navLinksEl.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on scroll
    window.addEventListener('scroll', () => {
      if (hamburger.classList.contains('open')) {
        hamburger.classList.remove('open');
        navLinksEl.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    }, { passive: true });
  }
}


function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ====================  PARTICLE BACKGROUND  ==================== */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 12000), 80);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.6 ? '0, 212, 255' : '124, 58, 237',
      });
    }
  }

  function drawConnections() {
    const maxDist = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }

  resize();
  spawnParticles();
  animate();
  window.addEventListener('resize', () => { resize(); spawnParticles(); });
}

/* ====================  SMOOTH SCROLL (LENIS)  ==================== */
function initLenis() {
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,      // disable on touch devices for native feel
    touchMultiplier: 2,
  });

  // Integrate with GSAP ticker for frame-perfect scroll
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0); // prevents GSAP from skipping frames
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Expose lenis globally so other functions can pause/resume it
  window._lenis = lenis;
}

/* ====================  GLOBE CANVAS (THREE.JS)  ==================== */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 4.5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(280, 280);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Group to rotate
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Wireframe geometry
  const geometry = new THREE.SphereGeometry(2, 32, 24);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });
  const sphere = new THREE.Mesh(geometry, material);
  globeGroup.add(sphere);

  // Data points (Dots)
  const dotsGeometry = new THREE.BufferGeometry();
  const dotsCount = 100;
  const positions = new Float32Array(dotsCount * 3);
  const colors = new Float32Array(dotsCount * 3);
  const color1 = new THREE.Color(0x00d4ff);
  const color2 = new THREE.Color(0x7c3aed);

  for(let i = 0; i < dotsCount; i++) {
    const phi = Math.acos(-1 + (2 * i) / dotsCount);
    const theta = Math.sqrt(dotsCount * Math.PI) * phi;

    const r = 2.02; // slightly outside the sphere
    positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
    positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  dotsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  dotsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const dotsMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  const dots = new THREE.Points(dotsGeometry, dotsMaterial);
  globeGroup.add(dots);

  // Glow
  const glowGeo = new THREE.SphereGeometry(2.1, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  function animateGlobe() {
    requestAnimationFrame(animateGlobe);
    globeGroup.rotation.y += 0.005;
    globeGroup.rotation.x += 0.001;
    renderer.render(scene, camera);
  }
  
  animateGlobe();
}

/* ====================  STAT COUNTERS  ==================== */
function initStatCounters() {
  const statEls = $$('[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const isDecimal = target % 1 !== 0;
        let start = 0;
        const duration = 1800;
        const startTime = performance.now();

        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = start + (target - start) * eased;
          el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => observer.observe(el));
}

/* ====================  HEATMAP CANVAS  ==================== */
function initHeatmap() {
  const canvas = document.getElementById('heatmap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const zones = [
    { x: 100, y: 55, r: 80, intensity: 0.85, label: 'North' },
    { x: 315, y: 55, r: 60, intensity: 0.45, label: 'VIP' },
    { x: 80, y: 165, r: 70, intensity: 0.72, label: 'Concourse A' },
    { x: 300, y: 165, r: 55, intensity: 0.28, label: 'Concourse B' },
  ];

  let time = 0;

  function intensityToColor(intensity) {
    if (intensity < 0.33) {
      const t = intensity / 0.33;
      return `rgba(${Math.floor(22 + t * 60)}, ${Math.floor(82 + t * 90)}, ${Math.floor(160 + t * 70)}, 0.7)`;
    } else if (intensity < 0.66) {
      const t = (intensity - 0.33) / 0.33;
      return `rgba(${Math.floor(82 + t * 163)}, ${Math.floor(172 + t * (158 - 172))}, ${Math.floor(230 - t * 200)}, 0.7)`;
    } else {
      const t = (intensity - 0.66) / 0.34;
      return `rgba(${Math.floor(245)}, ${Math.floor(158 - t * 100)}, ${Math.floor(11 - t * 11)}, 0.75)`;
    }
  }

  function drawHeatmap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#050e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stadium outline
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Grid lines
    for (let x = 40; x < canvas.width - 20; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, canvas.height - 20);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    for (let y = 40; y < canvas.height - 20; y += 40) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Draw heat zones
    zones.forEach((zone, i) => {
      const wobble = 1 + Math.sin(time * 0.04 + i * 1.3) * 0.08;
      const currentIntensity = Math.max(0.1, Math.min(1, zone.intensity + Math.sin(time * 0.03 + i * 0.7) * 0.08));
      const color = intensityToColor(currentIntensity);
      const r = zone.r * wobble;

      const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, r);
      gradient.addColorStop(0, color.replace('0.7', '0.85').replace('0.75', '0.9'));
      gradient.addColorStop(0.5, color.replace('0.7', '0.5').replace('0.75', '0.55'));
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(zone.x, zone.y, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Sensor dots
    const sensorPositions = [
      [50, 50], [100, 30], [160, 20], [230, 20], [310, 35], [380, 60], [400, 110], [390, 170],
      [310, 190], [220, 200], [150, 200], [80, 185], [30, 150], [20, 100],
    ];
    sensorPositions.forEach(([sx, sy], i) => {
      const pulse = 0.5 + Math.abs(Math.sin(time * 0.05 + i * 0.45)) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${0.4 + pulse * 0.5})`;
      ctx.fill();
    });

    time++;
    requestAnimationFrame(drawHeatmap);
  }

  drawHeatmap();
}

/* ====================  TICKET VALIDATION ANIMATION  ==================== */
function initTicketValidation() {
  const statusEl = document.getElementById('ticket-status');
  if (!statusEl) return;

  setTimeout(() => {
    statusEl.innerHTML = `
      <div class="status-indicator valid">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" fill="rgba(16,185,129,0.3)" stroke="#10b981" stroke-width="1.5"/>
          <path d="M4.5 7L6.5 9L9.5 5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>✓ Ticket Valid — Welcome!</span>
      </div>`;
  }, 2500);

  // Cycle back
  setInterval(() => {
    statusEl.innerHTML = `
      <div class="status-indicator validating">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>Validating...</span>
      </div>`;
    setTimeout(() => {
      statusEl.innerHTML = `
        <div class="status-indicator valid">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="rgba(16,185,129,0.3)" stroke="#10b981" stroke-width="1.5"/>
            <path d="M4.5 7L6.5 9L9.5 5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>✓ Ticket Valid — Welcome!</span>
        </div>`;
    }, 2000);
  }, 6000);
}

/* ====================  SENSOR ACTIVITY FEED  ==================== */
const feedMessages = [
  { type: 'cam', msg: 'Zone C density: 78 persons/m² — above threshold' },
  { type: 'iot', msg: 'Gate B3 pressure sensors: queue forming, 120kg avg' },
  { type: 'ble', msg: 'Beacon NW-04 detected 847 devices — surge predicted' },
  { type: 'cam', msg: 'Restroom C2: queue exceeds 45 persons — alert triggered' },
  { type: 'iot', msg: 'Concession stand D7: inventory below 15% for Fries' },
  { type: 'cam', msg: 'Exit E clear — routing ML model activated, rerouting 2.3K fans' },
  { type: 'ble', msg: 'Beacon SE-11 signal lost — fallback IoT active' },
  { type: 'iot', msg: 'Staff unit S-042 deployed to Gate A3 — AI recommendation' },
  { type: 'cam', msg: 'VIP section: occupancy at 44% — below threshold, all good' },
  { type: 'iot', msg: 'North Stand temperature: 28°C, ventilation auto-adjusted' },
  { type: 'ble', msg: 'Mobile app session count: 48,291 active fans' },
  { type: 'cam', msg: 'Emergency exit F: clear path confirmed, marking available' },
];

function initSensorFeed() {
  const feed = document.getElementById('sa-feed');
  if (!feed) return;

  let feedIndex = 4;

  setInterval(() => {
    const msg = feedMessages[feedIndex % feedMessages.length];
    feedIndex++;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const item = document.createElement('div');
    item.className = 'sa-item';
    item.style.opacity = '0';
    item.style.transform = 'translateY(-10px)';
    item.style.transition = 'all 0.4s ease';
    item.innerHTML = `<span class="sa-time">${time}</span><span class="sa-type ${msg.type}">${msg.type.toUpperCase()}</span><span class="sa-msg">${msg.msg}</span>`;

    feed.insertBefore(item, feed.firstChild);
    setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, 50);

    // Keep max 5 items
    while (feed.children.length > 5) {
      const last = feed.lastChild;
      last.style.opacity = '0';
      setTimeout(() => { if (last.parentNode) last.remove(); }, 400);
    }
  }, 2800);
}

/* ====================  LIVE COUNTERS  ==================== */
function initLiveCounters() {
  const eventsEl = document.getElementById('events-per-sec');

  setInterval(() => {
    state.eventsPerSec += Math.floor((Math.random() - 0.5) * 400);
    state.eventsPerSec = Math.max(10000, Math.min(16000, state.eventsPerSec));
    if (eventsEl) eventsEl.textContent = state.eventsPerSec.toLocaleString();

    state.routeCount += Math.floor(Math.random() * 3);
    const routeEl = document.getElementById('routes-count');
    if (routeEl) routeEl.textContent = state.routeCount.toLocaleString();
  }, 1200);
}

/* ====================  QUEUE TIMER SIMULATION  ==================== */
function initQueueSimulation() {
  const queues = {
    'q-gate-a1': { base: 130, noise: 30, render: ms => formatTime(ms) },
    'q-gate-b3': { base: 45, noise: 20, render: ms => formatTime(ms) },
    'q-burger': { base: 450, noise: 60, render: ms => formatTime(ms) },
    'q-pizza': { base: 195, noise: 40, render: ms => formatTime(ms) },
    'q-rest-c2': { base: 660, noise: 80, render: ms => formatTime(ms) },
    'q-rest-a1': { base: 260, noise: 45, render: ms => formatTime(ms) },
  };

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  setInterval(() => {
    Object.entries(queues).forEach(([id, q]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const noise = Math.floor((Math.random() - 0.5) * q.noise);
      const val = Math.max(10, q.base + noise);
      el.textContent = q.render(val);
    });
  }, 3000);
}

/* ====================  WAIT BARS ANIMATION  ==================== */
function initWaitBarsAnimation() {
  setInterval(() => {
    $$('.wait-bar').forEach(bar => {
      const current = parseInt(bar.style.width);
      const delta = Math.floor((Math.random() - 0.5) * 10);
      const newW = Math.max(5, Math.min(98, current + delta));
      bar.style.width = newW + '%';
    });
  }, 4000);
}

/* ====================  ATTENDANCE CHART (Chart.js)  ==================== */
/* ====================  ANALYTICS ENGINE (Chart.js)  ==================== */
function initAnalytics() {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = 'Inter, sans-serif';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 30, 53, 0.9)',
        titleColor: '#e2e8f0',
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true }
    }
  };

  // 1. Attendance Chart
  const ctxAtt = document.getElementById('attendance-chart');
  if (ctxAtt) {
    new Chart(ctxAtt, {
      type: 'line',
      data: {
        labels: ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
        datasets: [{
          data: [8200, 24000, 48000, 67000, 72000, 58000, 31000],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.15)',
          fill: true,
          tension: 0.4
        }]
      },
      options: chartOptions
    });
  }

  // 2. Revenue Chart
  const ctxRev = document.getElementById('revenue-chart');
  if (ctxRev) {
    new Chart(ctxRev, {
      type: 'bar',
      data: {
        labels: ['Tickets', 'Food', 'Merch', 'VIP', 'Ads'],
        datasets: [{
          data: [1200000, 450000, 320000, 680000, 150000],
          backgroundColor: [
            '#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'
          ],
          borderRadius: 4
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            ticks: { callback: v => '$' + (v / 1000000).toFixed(1) + 'M' }
          }
        }
      }
    });
  }

  // 3. Efficiency Chart (Radar)
  const ctxEff = document.getElementById('efficiency-chart');
  if (ctxEff) {
    new Chart(ctxEff, {
      type: 'radar',
      data: {
        labels: ['Energy', 'Waste', 'Staffing', 'Security', 'Throughput'],
        datasets: [{
          label: 'Current',
          data: [85, 92, 78, 95, 88],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.2)',
          pointBackgroundColor: '#00d4ff'
        }, {
          label: 'Predictive',
          data: [90, 95, 85, 98, 92],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.2)',
          pointBackgroundColor: '#7c3aed'
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { display: false },
            suggestedMin: 50,
            suggestedMax: 100
          }
        }
      }
    });
  }

  // Tab Logic
  const tabs = $$('.a-tab');
  const boxes = $$('.chart-box');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      tabs.forEach(t => t.classList.remove('active'));
      boxes.forEach(b => b.classList.remove('active'));
      
      tab.classList.add('active');
      const target = document.getElementById(`chart-${view}`);
      if (target) target.classList.add('active');
    });
  });
}

/* ====================  ALERTS ROTATION  ==================== */
function initAlertsRotation() {
  const alerts = [
    {
      icon: '🚶',
      title: 'Crowd Alert',
      body: 'Section 114 area getting dense — use Exit E for faster exit.',
      severity: 'high',
      time: 'Just now'
    },
    {
      icon: '🍕',
      title: 'Exclusive Offer',
      body: '20% off Pizza Palace — only 3 ahead in queue!',
      severity: 'offer',
      time: '2 min ago'
    },
    {
      icon: '🚪',
      title: 'Smart Exit',
      body: 'Leave now via Gate B3 — avoid the post-game rush. ETA: 4 min to car.',
      severity: 'med',
      time: '5 min ago'
    },
    {
      icon: '⏳',
      title: 'Queue Update',
      body: 'Burger Co. wait now 5 min — down from 9 min. Good time to order!',
      severity: 'offer',
      time: 'Just now'
    },
    {
      icon: '🏟️',
      title: 'Event Update',
      body: 'Half-time in 3 minutes. Concession counters staffed up. Beat the rush!',
      severity: 'med',
      time: 'Just now'
    },
  ];

  const container = document.getElementById('alerts-demo');
  if (!container) return;

  let idx = 0;
  setInterval(() => {
    const alert = alerts[idx % alerts.length];
    idx++;
    const now = new Date();
    const div = document.createElement('div');
    div.className = 'alert-item';
    div.innerHTML = `
      <div class="alert-icon">${alert.icon}</div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-body">${alert.body}</div>
        <div class="alert-time">Just now</div>
      </div>
      <div class="alert-severity ${alert.severity}"></div>`;
    div.style.opacity = '0';
    div.style.transform = 'translateX(-20px)';
    div.style.transition = 'all 0.45s ease';
    container.insertBefore(div, container.firstChild);
    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'translateX(0)'; }, 50);

    // Keep max 3
    while (container.children.length > 3) {
      const last = container.lastChild;
      last.style.opacity = '0';
      last.style.transform = 'translateX(20px)';
      setTimeout(() => { if (last.parentNode) last.remove(); }, 400);
    }
  }, 5000);
}

/* ====================  GATE LANE ANIMATION  ==================== */
function initGateLanes() {
  const lanes = [
    { id: 'lane-n1', fill: '.lane-fill', range: [65, 90] },
    { id: 'lane-n2', fill: '.lane-fill', range: [55, 80] },
    { id: 'lane-n3', fill: '.lane-fill', range: [85, 98] },
    { id: 'lane-s1', fill: '.lane-fill', range: [10, 30] },
    { id: 'lane-s2', fill: '.lane-fill', range: [20, 45] },
    { id: 'lane-s3', fill: '.lane-fill', range: [8, 25] },
  ];

  setInterval(() => {
    lanes.forEach(lane => {
      const el = document.getElementById(lane.id);
      if (!el) return;
      const fill = el.querySelector('.lane-fill');
      if (!fill) return;
      const [min, max] = lane.range;
      const newH = min + Math.random() * (max - min);
      fill.style.height = newH.toFixed(0) + '%';
    });
  }, 3500);
}

/* ====================  STAFF MOVEMENT SIMULATION  ==================== */
function initStaffMovement() {
  const dots = $$('.staff-dot');
  if (dots.length === 0) return;

  setInterval(() => {
    dots.forEach(dot => {
      const cx = parseFloat(dot.getAttribute('cx'));
      const cy = parseFloat(dot.getAttribute('cy'));
      const dx = (Math.random() - 0.5) * 4;
      const dy = (Math.random() - 0.5) * 4;
      
      // Boundary check simplified — keep within stadium area
      if (cx + dx > 20 && cx + dx < 380) dot.setAttribute('cx', cx + dx);
      if (cy + dy > 20 && cy + dy < 180) dot.setAttribute('cy', cy + dy);
    });
  }, 2000);
}

/* ====================  PIPELINE PARTICLES  ==================== */
function initPipelineParticles() {
  const containers = $$('.pipeline-line');
  if (containers.length === 0) return;

  containers.forEach(container => {
    setInterval(() => {
      const p = document.createElement('div');
      p.className = 'pipeline-particle';
      container.appendChild(p);

      const duration = 1500 + Math.random() * 1000;
      gsap.to(p, {
        left: '100%',
        opacity: 0,
        duration: duration / 1000,
        ease: 'none',
        onComplete: () => p.remove()
      });
    }, 400 + Math.random() * 600);
  });
}

/* ====================  NAV SCROLL EFFECT  ==================== */
function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.background = 'rgba(5, 11, 24, 0.95)';
    } else {
      nav.style.background = 'rgba(5, 11, 24, 0.85)';
    }
  }, { passive: true });
}

/* ====================  TIMESTAMPS  ==================== */
function initTimestamps() {
  const el = document.querySelector('.dh-sub');
  if (!el) return;
  setInterval(() => {
    const now = new Date();
    el.textContent = `All 4 layers · ${now.toLocaleTimeString('en-IN', { hour12: false })} UTC+5:30`;
  }, 1000);
}

/* ====================  SCROLL REVEAL (GSAP)  ==================== */
function initScrollReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero section animations
  gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1.2, ease: 'power4.out' });
  gsap.from('.hero-subtitle', { y: 30, opacity: 0, duration: 1.2, ease: 'power4.out', delay: 0.3 });
  gsap.from('.hero-cta button', { scale: 0.8, opacity: 0, duration: 1, ease: 'back.out(1.7)', delay: 0.5, stagger: 0.2 });
  gsap.from('.stat-card', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.8, stagger: 0.15 });

  // Glass card entrance
  const cardTargets = $$('.feature-card, .coord-card');
  cardTargets.forEach((el, i) => {
    gsap.from(el, {
      y: 60,
      scale: 0.95,
      opacity: 0,
      rotationX: -10,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  // Stagger reveal for small items
  const staggerTargets = $$('.arch-layer, .sensor-stat, .queue-card, .sa-item');
  staggerTargets.forEach((el) => {
    gsap.from(el, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 95%'
      }
    });
  });
}

/* ====================  AI DECISION LOG  ==================== */
function initAIDecisionLog() {
  const feed = document.getElementById('adl-feed');
  const totalEl = document.getElementById('adl-total');
  const autoEl  = document.getElementById('adl-auto');
  if (!feed) return;

  const decisions = [
    { layer: 'L1', tag: 'l1-tag', type: 'adl-route',  action: 'Reroute fan #48291 via alternate path — Gate A3 surge detected',               conf: '97.3%' },
    { layer: 'L3', tag: 'l3-tag', type: 'adl-staff',  action: 'Deploy 2 stewards to Gate NE — predicted queue overflow in 4 min',              conf: '91.8%' },
    { layer: 'L3', tag: 'l3-tag', type: 'adl-price',  action: 'Dynamic price drop: Fries $7→$5 at Stand D7 — low traffic, high stock',         conf: '88.4%' },
    { layer: 'L2', tag: 'l2-tag', type: 'adl-alert',  action: 'Crowd surge alert suppressed — density self-corrected via passive routing',      conf: '94.1%' },
    { layer: 'L4', tag: 'l4-tag', type: 'adl-route',  action: 'Cross-layer sync: L2 heatmap updated L3 staff positions · 14 units reallocated', conf: '99.2%' },
    { layer: 'L1', tag: 'l1-tag', type: 'adl-alert',  action: 'QR scan anomaly at Gate B3 lane 2 — flagged for manual review',                 conf: '82.7%' },
    { layer: 'L2', tag: 'l2-tag', type: 'adl-staff',  action: 'ML model retrained with latest 500ms heatmap snapshot — 0.3% accuracy gain',    conf: '99.9%' },
    { layer: 'L3', tag: 'l3-tag', type: 'adl-price',  action: 'Beer stand restocked — price reverted to base $9 per demand model',             conf: '90.1%' },
    { layer: 'L4', tag: 'l4-tag', type: 'adl-route',  action: 'Emergency exit F pre-cleared — halftime crowd surge imminent in 7 min',         conf: '96.5%' },
    { layer: 'L2', tag: 'l2-tag', type: 'adl-alert',  action: 'VIP section: occupancy at 44% — all sensor thresholds nominal',                conf: '98.8%' },
    { layer: 'L1', tag: 'l1-tag', type: 'adl-staff',  action: 'Wayfinding updated for 1,847 fans — shortest path recalculated post-gate open',  conf: '95.2%' },
    { layer: 'L3', tag: 'l3-tag', type: 'adl-alert',  action: 'HVAC zone North adjusted — temperature 29°C detected, target 24°C',             conf: '87.6%' },
  ];

  let idx = 5;
  let total = 1847;
  let auto  = 1791;

  function formatTime(secAgo) {
    if (secAgo < 5)  return 'just now';
    if (secAgo < 60) return `${secAgo}s ago`;
    return `${Math.floor(secAgo / 60)}m ago`;
  }

  setInterval(() => {
    const d = decisions[idx % decisions.length];
    idx++;

    // Build new item
    const item = document.createElement('div');
    item.className = `adl-item ${d.type}`;
    item.style.opacity = '0';
    item.style.transform = 'translateY(-12px)';
    item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    item.innerHTML = `
      <span class="adl-layer ${d.tag}">${d.layer}</span>
      <span class="adl-action">${d.action}</span>
      <span class="adl-conf">${d.conf}</span>
      <span class="adl-time">just now</span>`;

    feed.insertBefore(item, feed.firstChild);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
    });

    // Update timestamps on older items
    const items = feed.querySelectorAll('.adl-time');
    const baseAgo = [0, 12, 28, 45, 72, 105];
    items.forEach((t, i) => {
      if (i > 0) t.textContent = formatTime(baseAgo[i] || (i * 20));
    });

    // Trim to max 5 visible
    while (feed.children.length > 5) {
      const last = feed.lastChild;
      last.style.opacity = '0';
      setTimeout(() => { if (last.parentNode) last.remove(); }, 400);
    }

    // Tick counters
    total += Math.floor(Math.random() * 3) + 1;
    auto  += Math.random() > 0.15 ? 1 : 0; // ~85% auto rate
    if (totalEl) totalEl.textContent = total.toLocaleString();
    if (autoEl)  autoEl.textContent  = auto.toLocaleString();

  }, 3500);
}

/* ====================  TYPED.JS HERO HEADLINE  ==================== */
function initTyped() {
  const el = document.getElementById('typed-headline');
  if (!el || typeof Typed === 'undefined') {
    // Fallback if Typed.js fails to load
    if (el) el.textContent = 'Smart Stadium OS';
    return;
  }

  new Typed('#typed-headline', {
    strings: [
      'Smart Stadium OS',
      'Real-Time Command Core',
      'AI Crowd Intelligence',
      'Fan Experience Engine',
      'Smart Stadium OS',
    ],
    typeSpeed: 55,
    backSpeed: 30,
    backDelay: 2200,
    startDelay: 600,
    loop: true,
    cursorChar: '|',
    smartBackspace: true,
  });
}

/* ====================  VANILLA TILT — 3D CARD HOVER  ==================== */
function initVanillaTilt() {
  if (typeof VanillaTilt === 'undefined') return;

  // Only on devices that support hover (not touch screens)
  if (window.matchMedia('(hover: hover)').matches) {
    VanillaTilt.init(document.querySelectorAll('.feature-card, .coord-card, .arch-layer'), {
      max: 6,           // max tilt degrees
      speed: 400,       // transition speed
      glare: true,      // adds a glare spot
      'max-glare': 0.12, // subtle glare
      scale: 1.02,      // slight scale on hover
      perspective: 1200,
      reset: true,      // resets on mouse leave
    });
  }
}

/* ====================  GOOGLE MAPS VENUE MAP  ====================
 *
 * Primary: Google Maps JavaScript API (dark-styled, interactive markers,
 *          directions service, GA4 events on interactions).
 * Fallback: If the JS API key is unauthorised for the current domain,
 *           window.gm_authFailure fires and we swap in a free embedded
 *           iframe so the section always renders a real Google Map.
 * ================================================================== */

// Venue marker data for Chinnaswamy Stadium, Bengaluru
const STADIUM_CENTER = { lat: 12.97916, lng: 77.59946 };

const venueMarkers = [
  { id: 'gate-a',  label: 'Gate A — Main Entry',   lat: 12.97950, lng: 77.59900, color: '#00d4ff',  type: 'gate'    },
  { id: 'gate-b',  label: 'Gate B — North Entry',  lat: 12.98000, lng: 77.59946, color: '#00d4ff',  type: 'gate'    },
  { id: 'food',    label: 'Food Court — Level 2',  lat: 12.97930, lng: 77.60010, color: '#f59e0b',  type: 'food'    },
  { id: 'medical', label: 'Medical Center',         lat: 12.97880, lng: 77.59980, color: '#10b981',  type: 'medical' },
  { id: 'parking', label: 'Parking Zone P1',        lat: 12.97820, lng: 77.59900, color: '#7c3aed',  type: 'parking' },
];

let _googleMap        = null;
let _mapMarkers       = {};
let _directionsService  = null;
let _directionsRenderer = null;
let _mapFallbackMode  = false; // true when JS API key fails

/**
 * initGoogleMap — called as Google Maps API callback.
 * Renders an interactive dark-styled map of Chinnaswamy Stadium.
 */
function initGoogleMap() {
  // The map is displayed via a permanent iframe embed in the HTML —
  // no canvas rendering needed. We use the JS API only for:
  //   • DirectionsService (walking routes)
  //   • GA4 custom events (map_loaded, venue_card_click, directions_requested)
  if (typeof google === 'undefined') return;

  // Initialise DirectionsService for the "Get Directions" panel
  _directionsService  = new google.maps.DirectionsService();

  // Update ETA chip to show the map section is ready
  const etaEl = document.getElementById('dp-eta');
  if (etaEl) etaEl.textContent = 'Ready for directions';

  // GA4 — map section active
  if (window._gtagReady) {
    gtag('event', 'google_map_loaded', { stadium: 'Chinnaswamy', mode: 'embed_iframe' });
  }
}


/**
 * gm_authFailure — called automatically by the Maps JS API when the key
 * is invalid or not authorised for the current domain.
 * Replaces the broken map container with a working embedded iframe.
 */
window.gm_authFailure = function () {
  if (_mapFallbackMode) return; // already in fallback — don't run twice
  _mapFallbackMode = true;
  _googleMap       = null;  // prevent stale JS API calls

  const container = document.getElementById('google-map-container');
  if (!container) return;


  // Use Google Maps Embed (free, no key) for Chinnaswamy Stadium
  container.innerHTML = `
    <iframe
      id="gmap-iframe"
      title="M. Chinnaswamy Stadium — Google Maps"
      width="100%"
      height="100%"
      style="border:0;border-radius:12px;filter:grayscale(10%) brightness(0.85);"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.6285!2d77.59688!3d12.97916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae167b5ce1db3b%3A0x432f3b5cadc4cd3c!2sM.%20Chinnaswamy%20Stadium!5e0!3m2!1sen!2sin!4v1713200000000!5m2!1sen!2sin">
    </iframe>`;
  container.style.background = 'transparent';

  // Update status chip to reflect fallback
  const chip = document.getElementById('map-status-chip');
  if (chip) chip.textContent = '● Maps Embedded';

  // Update directions panel for fallback
  const etaEl = document.getElementById('dp-eta');
  if (etaEl) etaEl.textContent = 'Open in Google Maps';
  const panel = document.getElementById('directions-renderer-panel');
  if (panel) panel.innerHTML = 'Click <strong>Get Directions</strong> to open Google Maps navigation for Chinnaswamy Stadium.';

  // GA4 event — fallback mode
  if (window._gtagReady) {
    gtag('event', 'maps_fallback_activated', { reason: 'auth_failure' });
  }
};

/**
 * stadiumMapFocus — pan & zoom map to a venue marker.
 * Exposed globally so HTML onclick handlers can call it.
 */
function stadiumMapFocus(markerId) {
  // Highlight the active venue quick-info card
  document.querySelectorAll('.venue-info-card').forEach(c => c.classList.remove('vi-active'));
  const idMap = { 'gate-a': 'vi-gate', food: 'vi-food', medical: 'vi-medical', parking: 'vi-parking' };
  const card = document.getElementById(idMap[markerId]);
  if (card) card.classList.add('vi-active');

  // Pan the embedded iframe to the selected venue
  const vm = venueMarkers.find(m => m.id === markerId);
  if (!vm) return;
  const iframe = document.getElementById('gmap-iframe');
  if (iframe) {
    // Use the free embed URL centred on the venue's coordinates
    iframe.src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d${vm.lng}!3d${vm.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1713200000001`;
  }

  if (window._gtagReady) {
    gtag('event', 'venue_card_click', { venue_id: markerId });
  }
}

/**
 * getStadiumDirections — requests walking directions to the stadium
 * from the user-supplied origin input.
 */
function getStadiumDirections() {
  const input = document.getElementById('directions-origin');
  const etaEl  = document.getElementById('dp-eta');
  const panel  = document.getElementById('directions-renderer-panel');

  if (!input || !input.value.trim()) return;

  // Always open Google Maps in a new tab for reliable directions
  const query = encodeURIComponent(input.value.trim());
  const dest  = encodeURIComponent('M. Chinnaswamy Stadium, Bengaluru');
  window.open(`https://www.google.com/maps/dir/${query}/${dest}`, '_blank', 'noopener');
  if (etaEl)  etaEl.textContent = '↗ Opened in Google Maps';
  if (panel)  panel.innerHTML   = `Directions from <strong>${input.value.trim()}</strong> opened in Google Maps.`;
  if (window._gtagReady) {
    gtag('event', 'directions_requested', { origin: input.value.trim(), destination: 'Chinnaswamy Stadium' });
  }
}

/* ====================  BOOT  ==================== */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initParticles();
  initGlobe();
  initNav();
  initNavScroll();
  initStatCounters();
  initHeatmap();
  initTicketValidation();
  initSensorFeed();
  initLiveCounters();
  initQueueSimulation();
  initWaitBarsAnimation();
  initAnalytics();
  initAlertsRotation();
  initGateLanes();
  initStaffMovement();
  initPipelineParticles();
  initTimestamps();
  initScrollReveal();
  initTyped();
  initVanillaTilt();
  initAIDecisionLog();

  console.log('%c🏟️ StadiumGo Systems Online', 'font-size: 18px; font-weight: bold; color: #00d4ff; background: #050b18; padding: 8px 16px; border-radius: 8px;');
  console.log('%c4 Layers Active · All Sensors Online · AI Coordination Running', 'font-size: 12px; color: #94a3b8;');
});
