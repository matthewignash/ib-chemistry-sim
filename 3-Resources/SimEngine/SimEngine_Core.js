/**
 * SimEngine — IB Chemistry Simulation Engine
 * Reusable core modules for interactive chemistry simulations.
 *
 * Modules:
 *   SimEngine.State     — Centralized state + pub/sub event bus
 *   SimEngine.Particles — 2D particle simulation with physics
 *   SimEngine.Graph     — Canvas-based real-time graphing
 *   SimEngine.Controls  — UI control factories + keyboard handler
 */
var SimEngine = {};

// ─────────────────────────────────────────────
// MODULE 0: DATA
// Async data loader with fetch + inline fallback.
// JSON files are the canonical source; inline data
// in Core.js modules serves as safety net for file://
// ─────────────────────────────────────────────
SimEngine.Data = (function () {
  var _basePath = '../../3-Resources/SimEngine/data/';
  var _cache    = {};
  var _pending  = {};
  var _fallback = {};

  var _registry = {
    elements:            'elements.json',
    isotopes:            'isotopes.json',
    compounds_inorganic: 'compounds_inorganic.json',
    compounds_organic:   'compounds_organic.json',
    ib_data_booklet:     'ib_data_booklet.json',
    spectroscopy:        'spectroscopy_correlation.json',
    solubility_rules:    'solubility_rules.json',
    equipment:           'equipment.json',
    thermodynamic:       'thermodynamic_data.json',
    ghs_hazards:         'ghs_hazards.json'
  };

  function setBasePath(path) {
    _basePath = path.endsWith('/') ? path : path + '/';
  }

  function registerFallback(name, data) {
    _fallback[name] = data;
  }

  function get(name) {
    if (_cache[name] !== undefined) return _cache[name];
    if (_fallback[name] !== undefined) return _fallback[name];
    return null;
  }

  function load(name) {
    if (_cache[name]) return Promise.resolve(_cache[name]);
    if (_pending[name]) return _pending[name];

    var filename = _registry[name];
    if (!filename) {
      return _fallback[name]
        ? Promise.resolve(_fallback[name])
        : Promise.reject(new Error('SimEngine.Data: unknown dataset "' + name + '"'));
    }

    _pending[name] = fetch(_basePath + filename)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        return res.json();
      })
      .then(function (data) {
        _cache[name] = data;
        delete _pending[name];
        return data;
      })
      .catch(function (err) {
        delete _pending[name];
        if (_fallback[name]) {
          console.warn('SimEngine.Data: fetch "' + name + '" failed (' + err.message + '), using fallback');
          _cache[name] = _fallback[name];
          return _fallback[name];
        }
        throw new Error('SimEngine.Data: "' + name + '" unavailable — fetch failed and no fallback registered');
      });

    return _pending[name];
  }

  function loadAll(names) {
    return Promise.all(names.map(load));
  }

  return {
    setBasePath:      setBasePath,
    registerFallback: registerFallback,
    get:              get,
    load:             load,
    loadAll:          loadAll
  };
})();

// ─────────────────────────────────────────────
// MODULE 1: STATE
// Centralized state management + event bus.
// All modules communicate through State.
// ─────────────────────────────────────────────
SimEngine.State = (function () {
  const _store = {};
  const _listeners = {};

  function get(key) {
    return _store[key];
  }

  function set(key, value) {
    const prev = _store[key];
    _store[key] = value;
    emit('paramChange', { key, value, prev });
    emit(key, { value, prev });
  }

  function getAll() {
    return Object.assign({}, _store);
  }

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return function () {
      _listeners[event] = _listeners[event].filter(fn => fn !== callback);
    };
  }

  function emit(event, data) {
    const cbs = _listeners[event];
    if (cbs) {
      for (let i = 0; i < cbs.length; i++) {
        cbs[i](data);
      }
    }
  }

  function reset(defaults) {
    for (const key in defaults) {
      _store[key] = defaults[key];
    }
    emit('reset', _store);
  }

  return { get, set, getAll, on, emit, reset };
})();


// ─────────────────────────────────────────────
// MODULE 2: PARTICLES
// 2D particle simulation with elastic collisions,
// Maxwell-Boltzmann distribution, pressure measurement.
// ─────────────────────────────────────────────
SimEngine.Particles = (function () {
  const K_SIM = 0.02;
  const PARTICLES_PER_MOLE = 50;
  const MAX_PARTICLES = 600;
  const PRESSURE_SMOOTH_FRAMES = 240;
  let pressureWarmedUp = false;

  const SPECIES = {
    ideal: { name: 'Ideal Gas', mass: 1.0, radius: 3, a: 0, b: 0, color: null },
    he:    { name: 'Helium',    mass: 0.5, radius: 2, a: 0.0346, b: 0.0238, color: '#3B82F6' },
    n2:    { name: 'Nitrogen',  mass: 1.0, radius: 3, a: 1.370,  b: 0.0387, color: '#64748B' },
    co2:   { name: 'CO\u2082', mass: 1.5, radius: 4, a: 3.610,  b: 0.0429, color: '#EF4444' }
  };

  const x  = new Float64Array(MAX_PARTICLES);
  const y  = new Float64Array(MAX_PARTICLES);
  const vx = new Float64Array(MAX_PARTICLES);
  const vy = new Float64Array(MAX_PARTICLES);

  let count = 0;
  let species = 'ideal';
  let mass = 1.0;
  let radius = 3;

  let containerLeft = 0;
  let containerTop = 0;
  let containerRight = 600;
  let containerBottom = 400;

  let wallMomentumAccum = 0;
  const pressureBuffer = new Float64Array(PRESSURE_SMOOTH_FRAMES);
  let pressureBufferIdx = 0;
  let smoothedPressure = 0;

  let gridCellSize = 12;
  let gridCols = 0;
  let gridRows = 0;
  let grid = [];

  // Box-Muller Gaussian random
  let _hasSpare = false;
  let _spare = 0;
  function gaussRandom() {
    if (_hasSpare) { _hasSpare = false; return _spare; }
    let u, v, s;
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    s = Math.sqrt(-2 * Math.log(s) / s);
    _spare = v * s;
    _hasSpare = true;
    return u * s;
  }

  function init(n, T, bounds) {
    containerLeft = bounds.left;
    containerTop = bounds.top;
    containerRight = bounds.right;
    containerBottom = bounds.bottom;

    const spec = SPECIES[species];
    mass = spec.mass;
    radius = spec.radius;

    count = Math.min(n * PARTICLES_PER_MOLE, MAX_PARTICLES);
    const sigma = Math.sqrt(K_SIM * T / mass);

    const pad = radius + 2;
    const w = containerRight - containerLeft - 2 * pad;
    const h = containerBottom - containerTop - 2 * pad;

    for (let i = 0; i < count; i++) {
      x[i] = containerLeft + pad + Math.random() * w;
      y[i] = containerTop + pad + Math.random() * h;
      vx[i] = gaussRandom() * sigma;
      vy[i] = gaussRandom() * sigma;
    }

    pressureBuffer.fill(0);
    pressureBufferIdx = 0;
    wallMomentumAccum = 0;
    smoothedPressure = 0;
    pressureWarmedUp = false;
    rebuildGrid();
  }

  function setBounds(bounds) {
    containerLeft = bounds.left;
    containerTop = bounds.top;
    containerRight = bounds.right;
    containerBottom = bounds.bottom;
    rebuildGrid();

    const pad = radius + 1;
    for (let i = 0; i < count; i++) {
      if (x[i] - pad < containerLeft) x[i] = containerLeft + pad;
      if (x[i] + pad > containerRight) x[i] = containerRight - pad;
      if (y[i] - pad < containerTop) y[i] = containerTop + pad;
      if (y[i] + pad > containerBottom) y[i] = containerBottom - pad;
    }
  }

  function setTemperature(newT, oldT) {
    if (oldT <= 0 || newT <= 0) return;
    const scale = Math.sqrt(newT / oldT);
    for (let i = 0; i < count; i++) {
      vx[i] *= scale;
      vy[i] *= scale;
    }
  }

  function setParticleCount(newN, T) {
    const targetCount = Math.min(newN * PARTICLES_PER_MOLE, MAX_PARTICLES);
    const sigma = Math.sqrt(K_SIM * T / mass);
    const pad = radius + 2;
    const w = containerRight - containerLeft - 2 * pad;
    const h = containerBottom - containerTop - 2 * pad;

    if (targetCount > count) {
      for (let i = count; i < targetCount; i++) {
        x[i] = containerLeft + pad + Math.random() * w;
        y[i] = containerTop + pad + Math.random() * h;
        vx[i] = gaussRandom() * sigma;
        vy[i] = gaussRandom() * sigma;
      }
    }
    count = targetCount;
  }

  function setSpecies(speciesKey) {
    species = speciesKey;
    const spec = SPECIES[species];
    const oldMass = mass;
    mass = spec.mass;
    radius = spec.radius;
    gridCellSize = radius * 4;
    rebuildGrid();

    if (oldMass !== mass && oldMass > 0) {
      const scale = Math.sqrt(oldMass / mass);
      for (let i = 0; i < count; i++) {
        vx[i] *= scale;
        vy[i] *= scale;
      }
    }
  }

  function rebuildGrid() {
    gridCellSize = Math.max(radius * 4, 12);
    const w = containerRight - containerLeft;
    const h = containerBottom - containerTop;
    gridCols = Math.ceil(w / gridCellSize) || 1;
    gridRows = Math.ceil(h / gridCellSize) || 1;
    grid = new Array(gridCols * gridRows);
  }

  function populateGrid() {
    for (let c = 0; c < grid.length; c++) grid[c] = null;
    for (let i = 0; i < count; i++) {
      const col = Math.floor((x[i] - containerLeft) / gridCellSize);
      const row = Math.floor((y[i] - containerTop) / gridCellSize);
      const idx = Math.min(Math.max(row, 0), gridRows - 1) * gridCols + Math.min(Math.max(col, 0), gridCols - 1);
      if (!grid[idx]) grid[idx] = [i];
      else grid[idx].push(i);
    }
  }

  function resolveCollision(i, j) {
    const dx = x[j] - x[i];
    const dy = y[j] - y[i];
    const distSq = dx * dx + dy * dy;
    const minDist = radius * 2;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      const dvx = vx[i] - vx[j];
      const dvy = vy[i] - vy[j];
      const dvDotN = dvx * nx + dvy * ny;

      if (dvDotN > 0) {
        vx[i] -= dvDotN * nx;
        vy[i] -= dvDotN * ny;
        vx[j] += dvDotN * nx;
        vy[j] += dvDotN * ny;

        const overlap = minDist - dist;
        const sep = overlap * 0.5 + 0.1;
        x[i] -= sep * nx;
        y[i] -= sep * ny;
        x[j] += sep * nx;
        y[j] += sep * ny;
      }
    }
  }

  function applyVdWForces(dt) {
    const spec = SPECIES[species];
    if (spec.a === 0) return null;

    const interactionRadius = radius * 6;
    const interactionRadiusSq = interactionRadius * interactionRadius;
    const forceStrength = spec.a * 0.0005;
    const interactions = [];

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const distSq = dx * dx + dy * dy;

        if (distSq < interactionRadiusSq && distSq > radius * radius * 4) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const r = dist / (radius * 2);
          const force = forceStrength / (r * r);

          vx[i] += force * nx * dt;
          vy[i] += force * ny * dt;
          vx[j] -= force * nx * dt;
          vy[j] -= force * ny * dt;

          interactions.push(x[i], y[i], x[j], y[j], force);
        }
      }
    }
    return interactions.length > 0 ? interactions : null;
  }

  function step(dt) {
    wallMomentumAccum = 0;
    const hlEnabled = SimEngine.State.get('hlEnabled');
    let vdwInteractions = null;

    if (hlEnabled) {
      vdwInteractions = applyVdWForces(dt);
    }

    for (let i = 0; i < count; i++) {
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
    }

    // Wall collisions
    for (let i = 0; i < count; i++) {
      const r = radius;
      if (x[i] - r < containerLeft) {
        x[i] = containerLeft + r;
        wallMomentumAccum += 2 * mass * Math.abs(vx[i]);
        vx[i] = Math.abs(vx[i]);
      }
      if (x[i] + r > containerRight) {
        x[i] = containerRight - r;
        wallMomentumAccum += 2 * mass * Math.abs(vx[i]);
        vx[i] = -Math.abs(vx[i]);
      }
      if (y[i] - r < containerTop) {
        y[i] = containerTop + r;
        wallMomentumAccum += 2 * mass * Math.abs(vy[i]);
        vy[i] = Math.abs(vy[i]);
      }
      if (y[i] + r > containerBottom) {
        y[i] = containerBottom - r;
        wallMomentumAccum += 2 * mass * Math.abs(vy[i]);
        vy[i] = -Math.abs(vy[i]);
      }
    }

    // Inter-particle collisions
    populateGrid();
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIdx = row * gridCols + col;
        const cell = grid[cellIdx];
        if (!cell) continue;

        for (let a = 0; a < cell.length; a++) {
          for (let b = a + 1; b < cell.length; b++) {
            resolveCollision(cell[a], cell[b]);
          }
        }
        if (col + 1 < gridCols) {
          const right = grid[cellIdx + 1];
          if (right) {
            for (let a = 0; a < cell.length; a++) {
              for (let b = 0; b < right.length; b++) {
                resolveCollision(cell[a], right[b]);
              }
            }
          }
        }
        if (row + 1 < gridRows) {
          const below = grid[(row + 1) * gridCols + col];
          if (below) {
            for (let a = 0; a < cell.length; a++) {
              for (let b = 0; b < below.length; b++) {
                resolveCollision(cell[a], below[b]);
              }
            }
          }
        }
        if (row + 1 < gridRows && col + 1 < gridCols) {
          const br = grid[(row + 1) * gridCols + col + 1];
          if (br) {
            for (let a = 0; a < cell.length; a++) {
              for (let b = 0; b < br.length; b++) {
                resolveCollision(cell[a], br[b]);
              }
            }
          }
        }
        if (row + 1 < gridRows && col - 1 >= 0) {
          const bl = grid[(row + 1) * gridCols + col - 1];
          if (bl) {
            for (let a = 0; a < cell.length; a++) {
              for (let b = 0; b < bl.length; b++) {
                resolveCollision(cell[a], bl[b]);
              }
            }
          }
        }
      }
    }

    // Pressure measurement
    const perimeterLen = 2 * ((containerRight - containerLeft) + (containerBottom - containerTop));
    const framePressure = wallMomentumAccum / (perimeterLen * dt);
    pressureBuffer[pressureBufferIdx] = framePressure;
    pressureBufferIdx = (pressureBufferIdx + 1) % PRESSURE_SMOOTH_FRAMES;
    if (pressureBufferIdx === 0) pressureWarmedUp = true;

    let sum = 0;
    for (let i = 0; i < PRESSURE_SMOOTH_FRAMES; i++) sum += pressureBuffer[i];
    smoothedPressure = pressureWarmedUp ? sum / PRESSURE_SMOOTH_FRAMES : 0;

    return vdwInteractions;
  }

  function getIdealPressure(T, n) {
    const N = Math.min(n * PARTICLES_PER_MOLE, MAX_PARTICLES);
    const A = (containerRight - containerLeft) * (containerBottom - containerTop);
    return N * K_SIM * T / A;
  }

  function getVdWPressure(T, n) {
    const spec = SPECIES[species];
    if (spec.a === 0) return getIdealPressure(T, n);
    const N = Math.min(n * PARTICLES_PER_MOLE, MAX_PARTICLES);
    const A = (containerRight - containerLeft) * (containerBottom - containerTop);
    const nDensity = N / A;
    const effectiveA = A - N * spec.b * 100;
    if (effectiveA <= 0) return Infinity;
    return (N * K_SIM * T / effectiveA) - spec.a * nDensity * nDensity * 0.01;
  }

  function getSmoothedPressure() { return smoothedPressure; }

  function getAverageSpeed() {
    if (count === 0) return 0;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
    }
    return total / count;
  }

  function getAverageKE() {
    if (count === 0) return 0;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += 0.5 * mass * (vx[i] * vx[i] + vy[i] * vy[i]);
    }
    return total / count;
  }

  function getTotalKE() {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += 0.5 * mass * (vx[i] * vx[i] + vy[i] * vy[i]);
    }
    return total;
  }

  function getSpeedHistogram(numBins) {
    if (count === 0) return { bins: [], counts: [] };
    let maxSpeed = 0;
    for (let i = 0; i < count; i++) {
      const s = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      if (s > maxSpeed) maxSpeed = s;
    }
    maxSpeed = Math.max(maxSpeed, 0.1);
    const binWidth = (maxSpeed * 1.1) / numBins;
    const bins = new Float64Array(numBins);
    const counts = new Float64Array(numBins);

    for (let i = 0; i < count; i++) {
      const s = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      const b = Math.min(Math.floor(s / binWidth), numBins - 1);
      counts[b]++;
    }
    for (let b = 0; b < numBins; b++) {
      bins[b] = (b + 0.5) * binWidth;
      counts[b] /= (count * binWidth);
    }
    return { bins, counts, maxSpeed: maxSpeed * 1.1, binWidth };
  }

  function getMBTheoryCurve(T, numPoints) {
    // 2D Maxwell-Boltzmann: f(v) = (m / (k*T)) * v * exp(-m*v^2 / (2*k*T))
    const maxV = Math.sqrt(6 * K_SIM * T / mass);
    const dv = maxV / numPoints;
    const xs = new Float64Array(numPoints);
    const ys = new Float64Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      const v = (i + 0.5) * dv;
      xs[i] = v;
      ys[i] = (mass / (K_SIM * T)) * v * Math.exp(-mass * v * v / (2 * K_SIM * T));
    }
    return { xs, ys, maxV };
  }

  function render(ctx, showSpeciesColor) {
    const spec = SPECIES[species];
    const r = radius;
    const T = SimEngine.State.get('temperature') || 300;
    const vMax = Math.sqrt(4 * K_SIM * T / mass);

    for (let i = 0; i < count; i++) {
      const speed = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);

      if (spec.color && showSpeciesColor) {
        ctx.fillStyle = spec.color;
      } else {
        // Speed-based color: blue (slow) to red (fast)
        const t = Math.min(speed / vMax, 1);
        const rr = Math.round(59 + t * (239 - 59));
        const gg = Math.round(130 - t * 62);
        const bb = Math.round(246 - t * 178);
        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
      }

      ctx.beginPath();
      ctx.arc(x[i], y[i], r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderVdWInteractions(ctx, interactions) {
    if (!interactions) return;
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < interactions.length; i += 5) {
      ctx.beginPath();
      ctx.moveTo(interactions[i], interactions[i + 1]);
      ctx.lineTo(interactions[i + 2], interactions[i + 3]);
      ctx.stroke();
    }
  }

  return {
    SPECIES, K_SIM, PARTICLES_PER_MOLE,
    init, step, render, renderVdWInteractions,
    setBounds, setTemperature, setParticleCount, setSpecies,
    getSmoothedPressure, getIdealPressure, getVdWPressure,
    getAverageSpeed, getAverageKE, getTotalKE,
    getSpeedHistogram, getMBTheoryCurve,
    getCount: function () { return count; },
    isPressureWarmedUp: function () { return pressureWarmedUp; },
    getPositions: function () { return { x: x, y: y, count: count }; }
  };
})();


// ─────────────────────────────────────────────
// MODULE 3: GRAPH
// Canvas-based real-time graphing.
// ─────────────────────────────────────────────
SimEngine.Graph = (function () {
  const DPR = window.devicePixelRatio || 1;

  function create(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const w = config.width || 440;
    const h = config.height || 280;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const margin = { top: 30, right: 20, bottom: 45, left: 55 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    const graph = {
      canvas: canvas, ctx: ctx, w: w, h: h,
      margin: margin, plotW: plotW, plotH: plotH,
      title: config.title || '',
      xLabel: config.xLabel || '',
      yLabel: config.yLabel || '',
      xRange: config.xRange || [0, 10],
      yRange: config.yRange || [0, 10],
      autoScaleY: config.autoScaleY !== false,
      series: [],
      histData: null,
      overlayCurve: null,
      verticalLine: null,
      shadedRegion: null
    };

    graph.addSeries = function (id, color, lineWidth) {
      graph.series.push({ id: id, points: [], color: color || '#0D9488', lineWidth: lineWidth || 2 });
    };

    graph.addPoint = function (seriesId, px, py) {
      var s = graph.series.find(function (s) { return s.id === seriesId; });
      if (s) s.points.push({ x: px, y: py });
    };

    graph.clearSeries = function (seriesId) {
      var s = graph.series.find(function (s) { return s.id === seriesId; });
      if (s) s.points = [];
    };

    graph.setHistogramData = function (bins, counts, color) {
      graph.histData = { bins: bins, counts: counts, color: color || '#0D9488' };
    };

    graph.setOverlayCurve = function (xs, ys, color) {
      graph.overlayCurve = { xs: xs, ys: ys, color: color || '#EF4444' };
    };

    graph.setRanges = function (xRange, yRange) {
      if (xRange) graph.xRange = xRange;
      if (yRange) graph.yRange = yRange;
    };

    graph.setVerticalLine = function (x, color, label) {
      graph.verticalLine = { x: x, color: color || '#7C3AED', label: label || '' };
    };

    graph.clearVerticalLine = function () {
      graph.verticalLine = null;
    };

    graph.setShadedRegion = function (xStart, xEnd, color) {
      graph.shadedRegion = { xStart: xStart, xEnd: xEnd, color: color || 'rgba(124,58,237,0.15)' };
    };

    graph.clearShadedRegion = function () {
      graph.shadedRegion = null;
    };

    function toPixelX(dataX) {
      return margin.left + ((dataX - graph.xRange[0]) / (graph.xRange[1] - graph.xRange[0])) * plotW;
    }
    function toPixelY(dataY) {
      return margin.top + plotH - ((dataY - graph.yRange[0]) / (graph.yRange[1] - graph.yRange[0])) * plotH;
    }

    graph.draw = function () {
      ctx.clearRect(0, 0, w, h);

      // Auto-scale Y
      if (graph.autoScaleY) {
        var maxY = 0.001;
        for (var si = 0; si < graph.series.length; si++) {
          for (var pi = 0; pi < graph.series[si].points.length; pi++) {
            if (graph.series[si].points[pi].y > maxY) maxY = graph.series[si].points[pi].y;
          }
        }
        if (graph.histData) {
          for (var hi = 0; hi < graph.histData.counts.length; hi++) {
            if (graph.histData.counts[hi] > maxY) maxY = graph.histData.counts[hi];
          }
        }
        if (graph.overlayCurve) {
          for (var oi = 0; oi < graph.overlayCurve.ys.length; oi++) {
            if (graph.overlayCurve.ys[oi] > maxY) maxY = graph.overlayCurve.ys[oi];
          }
        }
        graph.yRange[1] = maxY * 1.15;
      }

      // Plot background
      ctx.fillStyle = '#FAFBFC';
      ctx.fillRect(margin.left, margin.top, plotW, plotH);

      // Grid
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      var numGridY = 5;
      for (var gy = 0; gy <= numGridY; gy++) {
        var yVal = graph.yRange[0] + (graph.yRange[1] - graph.yRange[0]) * gy / numGridY;
        var py = toPixelY(yVal);
        ctx.beginPath(); ctx.moveTo(margin.left, py); ctx.lineTo(margin.left + plotW, py); ctx.stroke();
      }
      var numGridX = 5;
      for (var gx = 0; gx <= numGridX; gx++) {
        var xVal = graph.xRange[0] + (graph.xRange[1] - graph.xRange[0]) * gx / numGridX;
        var px = toPixelX(xVal);
        ctx.beginPath(); ctx.moveTo(px, margin.top); ctx.lineTo(px, margin.top + plotH); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + plotH);
      ctx.lineTo(margin.left + plotW, margin.top + plotH);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#1E293B';
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(graph.xLabel, margin.left + plotW / 2, h - 5);
      ctx.save();
      ctx.translate(14, margin.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(graph.yLabel, 0, 0);
      ctx.restore();

      // Title
      ctx.font = "600 14px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(graph.title, w / 2, 18);

      // Tick labels
      ctx.font = "400 11px 'Inter', sans-serif";
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      for (var tx = 0; tx <= numGridX; tx++) {
        var txVal = graph.xRange[0] + (graph.xRange[1] - graph.xRange[0]) * tx / numGridX;
        ctx.fillText(txVal.toFixed(1), toPixelX(txVal), margin.top + plotH + 18);
      }
      ctx.textAlign = 'right';
      for (var ty = 0; ty <= numGridY; ty++) {
        var tyVal = graph.yRange[0] + (graph.yRange[1] - graph.yRange[0]) * ty / numGridY;
        ctx.fillText(tyVal.toFixed(2), margin.left - 6, toPixelY(tyVal) + 4);
      }

      // Histogram
      if (graph.histData && graph.histData.bins.length > 0) {
        var hd = graph.histData;
        var bw = hd.bins.length > 1 ? hd.bins[1] - hd.bins[0] : 1;
        ctx.fillStyle = hd.color + '44';
        ctx.strokeStyle = hd.color;
        ctx.lineWidth = 1.5;
        for (var bi = 0; bi < hd.bins.length; bi++) {
          var bx = toPixelX(hd.bins[bi] - bw / 2);
          var bxw = toPixelX(hd.bins[bi] + bw / 2) - bx;
          var by = toPixelY(hd.counts[bi]);
          var bh = toPixelY(0) - by;
          ctx.fillRect(bx, by, bxw, bh);
          ctx.strokeRect(bx, by, bxw, bh);
        }
      }

      // Overlay curve
      if (graph.overlayCurve && graph.overlayCurve.xs.length > 1) {
        var oc = graph.overlayCurve;
        ctx.strokeStyle = oc.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toPixelX(oc.xs[0]), toPixelY(oc.ys[0]));
        for (var ci = 1; ci < oc.xs.length; ci++) {
          ctx.lineTo(toPixelX(oc.xs[ci]), toPixelY(oc.ys[ci]));
        }
        ctx.stroke();
      }

      // Shaded region (drawn under overlay curve if present)
      if (graph.shadedRegion && graph.overlayCurve) {
        var sr = graph.shadedRegion;
        var oc2 = graph.overlayCurve;
        ctx.fillStyle = sr.color;
        ctx.beginPath();
        // Walk along overlay curve from xStart to xEnd, filling under it
        var started = false;
        for (var sri = 0; sri < oc2.xs.length; sri++) {
          if (oc2.xs[sri] >= sr.xStart && oc2.xs[sri] <= sr.xEnd) {
            if (!started) {
              ctx.moveTo(toPixelX(oc2.xs[sri]), toPixelY(0));
              started = true;
            }
            ctx.lineTo(toPixelX(oc2.xs[sri]), toPixelY(oc2.ys[sri]));
          }
        }
        if (started) {
          ctx.lineTo(toPixelX(Math.min(sr.xEnd, graph.xRange[1])), toPixelY(0));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Vertical line (e.g., Ea threshold)
      if (graph.verticalLine) {
        var vl = graph.verticalLine;
        var vlx = toPixelX(vl.x);
        if (vlx >= margin.left && vlx <= margin.left + plotW) {
          ctx.strokeStyle = vl.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(vlx, margin.top);
          ctx.lineTo(vlx, margin.top + plotH);
          ctx.stroke();
          ctx.setLineDash([]);
          if (vl.label) {
            ctx.fillStyle = vl.color;
            ctx.font = "600 12px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(vl.label, vlx, margin.top - 5);
          }
        }
      }

      // Line series
      for (var ssi = 0; ssi < graph.series.length; ssi++) {
        var s = graph.series[ssi];
        if (s.points.length < 1) continue;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.lineWidth;

        if (s.points.length === 1) {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(toPixelX(s.points[0].x), toPixelY(s.points[0].y), 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(toPixelX(s.points[0].x), toPixelY(s.points[0].y));
          for (var li = 1; li < s.points.length; li++) {
            ctx.lineTo(toPixelX(s.points[li].x), toPixelY(s.points[li].y));
          }
          ctx.stroke();

          ctx.fillStyle = s.color;
          for (var di = 0; di < s.points.length; di++) {
            ctx.beginPath();
            ctx.arc(toPixelX(s.points[di].x), toPixelY(s.points[di].y), 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    return graph;
  }

  return { create: create };
})();


// ─────────────────────────────────────────────
// MODULE 4: CONTROLS
// UI control factories + keyboard handler.
// ─────────────────────────────────────────────
SimEngine.Controls = (function () {

  function createSlider(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'sim-slider-group';

    var labelEl = document.createElement('label');
    labelEl.className = 'sim-label';
    labelEl.htmlFor = config.id;
    labelEl.textContent = config.label;

    var valueDisplay = document.createElement('span');
    valueDisplay.className = 'sim-value';
    valueDisplay.textContent = config.value + (config.unit || '');

    var input = document.createElement('input');
    input.type = 'range';
    input.id = config.id;
    input.className = 'sim-slider';
    input.min = config.min;
    input.max = config.max;
    input.step = config.step || 1;
    input.value = config.value;

    input.addEventListener('input', function () {
      var val = parseFloat(input.value);
      valueDisplay.textContent = val + (config.unit || '');
      if (config.stateKey) SimEngine.State.set(config.stateKey, val);
    });

    if (config.stateKey) {
      SimEngine.State.on(config.stateKey, function (e) {
        input.value = e.value;
        valueDisplay.textContent = e.value + (config.unit || '');
      });
    }

    var row = document.createElement('div');
    row.className = 'sim-slider-row';
    row.appendChild(labelEl);
    row.appendChild(valueDisplay);
    wrapper.appendChild(row);
    wrapper.appendChild(input);

    if (config.container) {
      document.getElementById(config.container).appendChild(wrapper);
    }
    return wrapper;
  }

  function createDropdown(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'sim-dropdown-group';

    var labelEl = document.createElement('label');
    labelEl.className = 'sim-label';
    labelEl.htmlFor = config.id;
    labelEl.textContent = config.label;

    var select = document.createElement('select');
    select.id = config.id;
    select.className = 'sim-dropdown';

    for (var i = 0; i < config.options.length; i++) {
      var opt = config.options[i];
      var optEl = document.createElement('option');
      optEl.value = opt.value;
      optEl.textContent = opt.text;
      if (opt.value === config.value) optEl.selected = true;
      select.appendChild(optEl);
    }

    select.addEventListener('change', function () {
      if (config.stateKey) SimEngine.State.set(config.stateKey, select.value);
    });

    if (config.stateKey) {
      SimEngine.State.on(config.stateKey, function (e) {
        select.value = e.value;
      });
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(select);

    if (config.container) {
      document.getElementById(config.container).appendChild(wrapper);
    }
    return wrapper;
  }

  function createToggle(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'sim-toggle-group';

    var labelEl = document.createElement('span');
    labelEl.className = 'sim-label';
    labelEl.textContent = config.label;

    var toggle = document.createElement('label');
    toggle.className = 'sim-toggle';

    var input = document.createElement('input');
    input.type = 'checkbox';
    input.id = config.id;
    input.checked = config.checked || false;

    var slider = document.createElement('span');
    slider.className = 'sim-toggle-slider';
    if (config.colorOn) slider.style.setProperty('--toggle-on', config.colorOn);

    var stateLabel = document.createElement('span');
    stateLabel.className = 'sim-toggle-label';
    stateLabel.textContent = input.checked ? (config.labelOn || 'ON') : (config.labelOff || 'OFF');

    input.addEventListener('change', function () {
      stateLabel.textContent = input.checked ? (config.labelOn || 'ON') : (config.labelOff || 'OFF');
      if (config.stateKey) SimEngine.State.set(config.stateKey, input.checked);
    });

    if (config.stateKey) {
      SimEngine.State.on(config.stateKey, function (e) {
        input.checked = e.value;
        stateLabel.textContent = e.value ? (config.labelOn || 'ON') : (config.labelOff || 'OFF');
      });
    }

    toggle.appendChild(input);
    toggle.appendChild(slider);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(toggle);
    wrapper.appendChild(stateLabel);

    if (config.container) {
      document.getElementById(config.container).appendChild(wrapper);
    }
    return wrapper;
  }

  function createButton(config) {
    var btn = document.createElement('button');
    btn.id = config.id || '';
    btn.className = 'sim-btn ' + (config.className || '');
    btn.textContent = (config.icon || '') + ' ' + (config.text || '');
    btn.addEventListener('click', config.onClick);

    if (config.container) {
      document.getElementById(config.container).appendChild(btn);
    }
    return btn;
  }

  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          var playing = SimEngine.State.get('playing');
          SimEngine.State.set('playing', !playing);
          break;
        case 'KeyR':
          SimEngine.State.emit('reset');
          break;
        case 'KeyT':
          var mode = SimEngine.State.get('mode');
          // Toggle: supports both boolean (from toggle widget) and string values
          var isTeacher = (mode === true || mode === 'teacher');
          SimEngine.State.set('mode', !isTeacher);
          break;
        case 'KeyH':
          var hl = SimEngine.State.get('hlEnabled');
          SimEngine.State.set('hlEnabled', !hl);
          break;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
          SimEngine.State.emit('viewSwitch', { view: parseInt(e.code.slice(-1)) });
          break;
      }
    });
  }

  return {
    createSlider: createSlider,
    createDropdown: createDropdown,
    createToggle: createToggle,
    createButton: createButton,
    initKeyboard: initKeyboard
  };
})();

// ─────────────────────────────────────────────
// MODULE 5: REACTION
// Equilibrium reaction database, particle
// initialization, and color-change / collision
// reaction stepping.
// ─────────────────────────────────────────────
SimEngine.Reaction = (function () {

  // ── Constants ──────────────────────────────
  var R_GAS = 8.314;           // J/(mol·K)
  var K_SIM = 0.02;            // simulation Boltzmann constant
  var MAX_PARTICLES = 400;
  var RATE_SMOOTH_FRAMES = 60;
  var CONC_SCALE = 100;        // particles per molar (100 particles = 1.0 M)
  var MAX_LOG_POINTS = 3600;   // 60s at 60fps for concentration-time logging

  // ── Reaction database ─────────────────────
  var REACTIONS = {
    'N2O4_NO2': {
      equation: 'N₂O₄ ⇌ 2NO₂',
      Kc_298: 4.6e-3,
      dH: 57200,
      dn: 1,
      Ea_f: 55000,
      Ea_r: 55000 - 57200,    // Ea_r = Ea_f - dH = -2200
      phase: 'gas',
      stoich: {
        reactants: [{ name: 'N₂O₄', coeff: 1 }],
        products:  [{ name: 'NO₂',  coeff: 2 }]
      },
      colors: { reactants: ['#CBD5E1'], products: ['#92400E'] },
      labels: { reactants: ['N₂O₄'], products: ['NO₂'] }
    },
    'haber': {
      equation: 'N₂ + 3H₂ ⇌ 2NH₃',
      Kc_298: 6.0e5,
      dH: -92200,
      dn: -2,
      Ea_f: 230000,
      Ea_r: 230000 - (-92200), // Ea_r = 322200
      phase: 'gas',
      stoich: {
        reactants: [{ name: 'N₂', coeff: 1 }, { name: 'H₂', coeff: 3 }],
        products:  [{ name: 'NH₃', coeff: 2 }]
      },
      colors: { reactants: ['#3B82F6', '#94A3B8'], products: ['#059669'] },
      labels: { reactants: ['N₂', 'H₂'], products: ['NH₃'] }
    },
    'cobalt': {
      equation: 'Co(H₂O)₆²⁺ ⇌ CoCl₄²⁻',
      Kc_298: 1.0e-2,
      dH: 50000,
      dn: 0,
      Ea_f: 60000,
      Ea_r: 60000 - 50000,    // Ea_r = 10000
      phase: 'aqueous',
      stoich: {
        reactants: [{ name: 'Co(H₂O)₆²⁺', coeff: 1 }],
        products:  [{ name: 'CoCl₄²⁻',     coeff: 1 }]
      },
      colors: { reactants: ['#EC4899'], products: ['#2563EB'] },
      labels: { reactants: ['Co(H₂O)₆²⁺'], products: ['CoCl₄²⁻'] }
    },
    'thiocyanate': {
      equation: 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺',
      Kc_298: 1.4e2,
      dH: -1500,
      dn: 0,
      Ea_f: 30000,
      Ea_r: 30000 - (-1500),  // Ea_r = 31500
      phase: 'aqueous',
      stoich: {
        reactants: [{ name: 'Fe³⁺', coeff: 1 }, { name: 'SCN⁻', coeff: 1 }],
        products:  [{ name: 'FeSCN²⁺', coeff: 1 }]
      },
      colors: { reactants: ['#EAB308', '#CBD5E1'], products: ['#DC2626'] },
      labels: { reactants: ['Fe³⁺', 'SCN⁻'], products: ['FeSCN²⁺'] }
    },

    // ── Irreversible model reactions (rate-law studies) ──

    'model_A_B': {
      equation: 'A → B',
      irreversible: true,
      orders: { 'A': 1 },
      k_298: 0.05,           // s⁻¹
      Ea_f: 50000,
      dH: -40000,
      catEa_f: null,
      phase: 'generic',
      stoich: {
        reactants: [{ name: 'A', coeff: 1 }],
        products:  [{ name: 'B', coeff: 1 }]
      },
      colors: { reactants: ['#3B82F6'], products: ['#EF4444'] },
      labels: { reactants: ['A'], products: ['B'] }
    },
    'model_AB_C': {
      equation: 'A + B → C',
      irreversible: true,
      orders: { 'A': 1, 'B': 1 },
      k_298: 0.8,            // M⁻¹s⁻¹
      Ea_f: 60000,
      dH: -55000,
      catEa_f: null,
      phase: 'generic',
      stoich: {
        reactants: [{ name: 'A', coeff: 1 }, { name: 'B', coeff: 1 }],
        products:  [{ name: 'C', coeff: 1 }]
      },
      colors: { reactants: ['#3B82F6', '#10B981'], products: ['#F59E0B'] },
      labels: { reactants: ['A', 'B'], products: ['C'] }
    },
    'model_2A_B': {
      equation: '2A → B',
      irreversible: true,
      orders: { 'A': 2 },
      k_298: 0.2,            // M⁻¹s⁻¹
      Ea_f: 65000,
      dH: -30000,
      catEa_f: null,
      phase: 'generic',
      stoich: {
        reactants: [{ name: 'A', coeff: 2 }],
        products:  [{ name: 'B', coeff: 1 }]
      },
      colors: { reactants: ['#3B82F6'], products: ['#EF4444'] },
      labels: { reactants: ['A'], products: ['B'] }
    },

    // ── Irreversible real reactions (rate-law studies) ──

    'h2o2_decomp': {
      equation: '2H₂O₂ → 2H₂O + O₂',
      irreversible: true,
      orders: { 'H₂O₂': 1 },
      k_298: 1.0e-3,         // s⁻¹
      Ea_f: 75000,
      dH: -196000,
      catEa_f: 56000,        // MnO₂ catalyst
      phase: 'aqueous',
      stoich: {
        reactants: [{ name: 'H₂O₂', coeff: 2 }],
        products:  [{ name: 'H₂O', coeff: 2 }, { name: 'O₂', coeff: 1 }]
      },
      colors: { reactants: ['#60A5FA'], products: ['#93C5FD', '#CBD5E1'] },
      labels: { reactants: ['H₂O₂'], products: ['H₂O', 'O₂'] }
    },
    'iodine_clock': {
      equation: 'H₂O₂ + 2I⁻ → I₂ + 2H₂O',
      irreversible: true,
      orders: { 'H₂O₂': 1, 'I⁻': 1 },
      k_298: 0.012,          // M⁻¹s⁻¹
      Ea_f: 56000,
      dH: -180000,
      catEa_f: null,
      phase: 'aqueous',
      stoich: {
        reactants: [{ name: 'H₂O₂', coeff: 1 }, { name: 'I⁻', coeff: 2 }],
        products:  [{ name: 'I₂', coeff: 1 }, { name: 'H₂O', coeff: 2 }]
      },
      colors: { reactants: ['#60A5FA', '#CBD5E1'], products: ['#7C3AED', '#93C5FD'] },
      labels: { reactants: ['H₂O₂', 'I⁻'], products: ['I₂', 'H₂O'] }
    },
    'marble_hcl': {
      equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',
      irreversible: true,
      orders: { 'HCl': 1 },
      k_298: 0.03,           // s⁻¹
      Ea_f: 42000,
      dH: -57000,
      catEa_f: null,
      phase: 'heterogeneous',
      stoich: {
        reactants: [{ name: 'HCl', coeff: 2 }],
        products:  [{ name: 'CO₂', coeff: 1 }, { name: 'CaCl₂', coeff: 1 }]
      },
      colors: { reactants: ['#34D399'], products: ['#CBD5E1', '#F5F5F4'] },
      labels: { reactants: ['HCl'], products: ['CO₂', 'CaCl₂'] }
    },
    'thiosulfate_hcl': {
      equation: 'Na₂S₂O₃ + 2HCl → S + SO₂ + 2NaCl + H₂O',
      irreversible: true,
      orders: { 'S₂O₃²⁻': 1, 'H⁺': 1 },
      k_298: 0.05,           // M⁻¹s⁻¹
      Ea_f: 50000,
      dH: -45000,
      catEa_f: null,
      phase: 'aqueous',
      stoich: {
        reactants: [{ name: 'S₂O₃²⁻', coeff: 1 }, { name: 'H⁺', coeff: 2 }],
        products:  [{ name: 'S', coeff: 1 }, { name: 'SO₂', coeff: 1 }]
      },
      colors: { reactants: ['#CBD5E1', '#F87171'], products: ['#FBBF24', '#A3A3A3'] },
      labels: { reactants: ['S₂O₃²⁻', 'H⁺'], products: ['S', 'SO₂'] }
    }
  };

  // ── Internal state ─────────────────────────
  var _reaction       = null;   // key into REACTIONS
  var _reactionData   = null;   // the REACTIONS[key] object
  var _mode           = 'color-change';
  var _bounds         = { left: 0, top: 0, right: 600, bottom: 400 };
  var _T              = 298;
  var _totalParticles = 100;

  // Structure-of-Arrays particle storage
  var _x       = new Float64Array(MAX_PARTICLES);
  var _y       = new Float64Array(MAX_PARTICLES);
  var _vx      = new Float64Array(MAX_PARTICLES);
  var _vy      = new Float64Array(MAX_PARTICLES);
  var _species = new Int8Array(MAX_PARTICLES);  // index into _speciesList
  var _n       = 0;  // active particle count

  var _speciesList = [];  // flat array: [{ name, coeff, side, color, label }, ...]

  // Rate tracking (rolling buffer)
  var _forwardEvents  = 0;
  var _reverseEvents  = 0;
  var _forwardBuffer  = null;
  var _reverseBuffer  = null;
  var _bufferIndex    = 0;
  var _bufferFull     = false;

  // Current rate constants
  var _kf = 0;
  var _kr = 0;
  var _fEq = 0.5;  // target equilibrium product fraction

  // Catalyst state
  var _catalystActive = false;

  // Concentration-time logging
  var _concTimeLog = null;  // initialized in init()
  var _simFrameCount = 0;

  // Collision frequency tracking
  var _collisionCount = 0;
  var _collisionBuffer = null;
  var _collisionBufIdx = 0;
  var _collisionBufFull = false;

  // ── Helper: Box-Muller normal random ───────
  function gaussRandom() {
    var u1 = Math.random();
    var u2 = Math.random();
    while (u1 === 0) { u1 = Math.random(); }
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  // ── Helper: 2D Maxwell-Boltzmann speed ─────
  // In 2D the MB speed distribution has mean ~ sqrt(pi*kT / 2m).
  // We sample each velocity component from N(0, sqrt(kT/m)).
  function mbSpeed(T, mass) {
    var sigma = Math.sqrt(K_SIM * T / (mass || 1));
    var vx = sigma * gaussRandom();
    var vy = sigma * gaussRandom();
    return Math.sqrt(vx * vx + vy * vy);
  }

  // ── Helper: build flat species list ────────
  // Returns array of { name, coeff, side, color, label, sideIndex }
  function buildSpeciesList(rxn) {
    var list = [];
    var i;
    for (i = 0; i < rxn.stoich.reactants.length; i++) {
      list.push({
        name:      rxn.stoich.reactants[i].name,
        coeff:     rxn.stoich.reactants[i].coeff,
        side:      'reactant',
        color:     rxn.colors.reactants[i] || '#888888',
        label:     rxn.labels.reactants[i] || rxn.stoich.reactants[i].name,
        sideIndex: i
      });
    }
    for (i = 0; i < rxn.stoich.products.length; i++) {
      list.push({
        name:      rxn.stoich.products[i].name,
        coeff:     rxn.stoich.products[i].coeff,
        side:      'product',
        color:     rxn.colors.products[i] || '#888888',
        label:     rxn.labels.products[i] || rxn.stoich.products[i].name,
        sideIndex: i
      });
    }
    return list;
  }

  // ── Helper: solve equilibrium product fraction ──
  // Given Kc and stoichiometry, find f (product fraction) where
  // Q_frac(f) = f^pCoeff / (1-f)^rCoeff = Kc
  // Uses bisection search.
  function solveEquilibriumFraction(Kc, rCoeff, pCoeff) {
    var lo = 0.001, hi = 0.999, mid, q;
    for (var iter = 0; iter < 60; iter++) {
      mid = (lo + hi) * 0.5;
      q = Math.pow(mid, pCoeff) / Math.pow(1 - mid, rCoeff);
      if (q < Kc) { lo = mid; } else { hi = mid; }
    }
    return mid;
  }

  // ── Helper: compute rate constants from equilibrium fraction ──
  // Per-particle probabilities: kf for reactants, kr for products.
  // At equilibrium: kf * nReact = kr * nProd → kf/kr = fEq/(1-fEq).
  // BASE_RATE controls overall reaction speed (visual turnover).
  var BASE_RATE = 0.003;

  function computeRateConstants(rxn, T) {
    // Kc at temperature T via van't Hoff
    var Kc_T = rxn.Kc_298 * Math.exp(-rxn.dH / R_GAS * (1 / T - 1 / 298));

    // Total stoichiometric coefficients
    var rCoeff = 0, pCoeff = 0, i;
    for (i = 0; i < rxn.stoich.reactants.length; i++) rCoeff += rxn.stoich.reactants[i].coeff;
    for (i = 0; i < rxn.stoich.products.length; i++) pCoeff += rxn.stoich.products[i].coeff;

    // Solve for equilibrium product fraction
    var fEq = solveEquilibriumFraction(Kc_T, rCoeff, pCoeff);
    fEq = Math.max(0.01, Math.min(0.99, fEq));

    // Per-particle probabilities
    var kf = BASE_RATE;
    var kr = BASE_RATE * (1 - fEq) / fEq;

    return { kf: kf, kr: kr, fEq: fEq, Kc_T: Kc_T };
  }

  // ── Helper: compute rate constant for irreversible reaction via Arrhenius ──
  function computeIrreversibleK(rxn, T, useCatalyst) {
    var Ea = (useCatalyst && rxn.catEa_f != null) ? rxn.catEa_f : rxn.Ea_f;
    return rxn.k_298 * Math.exp(-Ea / R_GAS * (1.0 / T - 1.0 / 298.0));
  }

  // ── Helper: count particles by species name ──
  function countBySpeciesName(name) {
    var count = 0;
    for (var i = 0; i < _n; i++) {
      if (_speciesList[_species[i]].name === name) count++;
    }
    return count;
  }

  // ── stepIrreversible(dt) ───────────────────
  // Quantitative irreversible kinetics: rate = k[A]^m[B]^n
  // Converts particle counts to concentrations via CONC_SCALE.
  function stepIrreversible(dt) {
    var rxn = _reactionData;
    var k = computeIrreversibleK(rxn, _T, _catalystActive);

    // Compute concentrations from particle counts
    // Each unique reactant species name maps to a concentration
    var rate = k;
    var orderKeys = Object.keys(rxn.orders);
    for (var oi = 0; oi < orderKeys.length; oi++) {
      var specName = orderKeys[oi];
      var order = rxn.orders[specName];
      var nParticles = countBySpeciesName(specName);
      var conc = nParticles / CONC_SCALE;
      rate *= Math.pow(Math.max(conc, 0), order);
    }

    // Convert rate (M/s) to expected reaction events per frame
    // rate [M/s] * CONC_SCALE [particles/M] / 60 [frames/s] = events/frame
    var eventsPerFrame = rate * CONC_SCALE / 60.0;

    // Determine how many events this frame (Poisson-like: deterministic + fractional)
    var wholeEvents = Math.floor(eventsPerFrame);
    var fractional = eventsPerFrame - wholeEvents;
    if (Math.random() < fractional) wholeEvents++;

    // Build species index lists
    var reactantIndices = [];
    var productIndices = [];
    var si;
    for (si = 0; si < _speciesList.length; si++) {
      if (_speciesList[si].side === 'reactant') reactantIndices.push(si);
      else productIndices.push(si);
    }

    // Clamp to available reactants
    var nReactants = 0;
    for (var ri = 0; ri < _n; ri++) {
      if (_speciesList[_species[ri]].side === 'reactant') nReactants++;
    }
    wholeEvents = Math.min(wholeEvents, nReactants);

    // Convert reactant particles to products
    var converted = 0;
    for (var pi = 0; pi < _n && converted < wholeEvents; pi++) {
      if (_speciesList[_species[pi]].side === 'reactant') {
        _species[pi] = productIndices[Math.floor(Math.random() * productIndices.length)];
        converted++;
      }
    }

    _forwardEvents += converted;
  }

  // ── init(config) ───────────────────────────
  // config: { reactionKey, mode, bounds, temperature, particleCount, initialConc, initialConcB }
  function init(config) {
    _reaction     = config.reactionKey || 'N2O4_NO2';
    _reactionData = REACTIONS[_reaction];
    if (!_reactionData) {
      throw new Error('SimEngine.Reaction: unknown reaction key "' + _reaction + '"');
    }
    _mode           = config.mode || 'color-change';
    _bounds         = config.bounds || { left: 0, top: 0, right: 600, bottom: 400 };
    _T              = config.temperature || 298;
    _catalystActive = config.catalyst || false;

    // Build species list
    _speciesList = buildSpeciesList(_reactionData);

    // Allocate / reset arrays
    _x       = new Float64Array(MAX_PARTICLES);
    _y       = new Float64Array(MAX_PARTICLES);
    _vx      = new Float64Array(MAX_PARTICLES);
    _vy      = new Float64Array(MAX_PARTICLES);
    _species = new Int8Array(MAX_PARTICLES);

    // Build index ranges for reactant and product species
    var reactantIndices = [];
    var productIndices  = [];
    var si;
    for (si = 0; si < _speciesList.length; si++) {
      if (_speciesList[si].side === 'reactant') { reactantIndices.push(si); }
      else { productIndices.push(si); }
    }

    var w = _bounds.right - _bounds.left;
    var h = _bounds.bottom - _bounds.top;
    var i, sp, sigma;

    if (_reactionData.irreversible) {
      // Irreversible: start with all reactants, count from concentration
      var concA = config.initialConc || 1.0;
      _totalParticles = Math.min(Math.round(concA * CONC_SCALE), MAX_PARTICLES);

      // For two-reactant reactions (A + B → C), split particles by stoichiometry
      // or use initialConcB for second reactant
      if (reactantIndices.length === 1) {
        // Single reactant: all particles are that species
        _n = _totalParticles;
        for (i = 0; i < _n; i++) {
          _species[i] = reactantIndices[0];
        }
      } else {
        // Multiple reactants: split by concentration
        var concB = config.initialConcB || concA;
        var nA = Math.min(Math.round(concA * CONC_SCALE), MAX_PARTICLES);
        var nB = Math.min(Math.round(concB * CONC_SCALE), MAX_PARTICLES - nA);
        _n = nA + nB;
        _totalParticles = _n;
        for (i = 0; i < nA; i++) {
          _species[i] = reactantIndices[0];
        }
        for (i = nA; i < _n; i++) {
          _species[i] = reactantIndices.length > 1 ? reactantIndices[1] : reactantIndices[0];
        }
      }

      // No equilibrium rate constants needed for irreversible
      _kf = 0;
      _kr = 0;
      _fEq = 0;
    } else {
      // Equilibrium: original behavior
      _totalParticles = Math.min(config.particleCount || 100, MAX_PARTICLES);
      _n = _totalParticles;

      var rates = computeRateConstants(_reactionData, _T);
      _kf = rates.kf;
      _kr = rates.kr;
      _fEq = rates.fEq;

      var nProduct  = Math.round(_totalParticles * _fEq);
      var nReactant = _totalParticles - nProduct;

      for (i = 0; i < _totalParticles; i++) {
        if (i < nReactant) {
          sp = reactantIndices[Math.floor(Math.random() * reactantIndices.length)];
        } else {
          sp = productIndices[Math.floor(Math.random() * productIndices.length)];
        }
        _species[i] = sp;
      }
    }

    // Random positions and MB velocities for all particles
    sigma = Math.sqrt(K_SIM * _T / 1.0);
    for (i = 0; i < _n; i++) {
      _x[i] = _bounds.left + 6 + Math.random() * (w - 12);
      _y[i] = _bounds.top  + 6 + Math.random() * (h - 12);
      _vx[i] = sigma * gaussRandom();
      _vy[i] = sigma * gaussRandom();
    }

    // Reset rate tracking buffers
    _forwardEvents = 0;
    _reverseEvents = 0;
    _forwardBuffer = new Float64Array(RATE_SMOOTH_FRAMES);
    _reverseBuffer = new Float64Array(RATE_SMOOTH_FRAMES);
    _bufferIndex   = 0;
    _bufferFull    = false;

    // Reset collision tracking
    _collisionCount = 0;
    _collisionBuffer = new Float64Array(RATE_SMOOTH_FRAMES);
    _collisionBufIdx = 0;
    _collisionBufFull = false;

    // Reset concentration-time log
    _simFrameCount = 0;
    _concTimeLog = {
      time:        new Float64Array(MAX_LOG_POINTS),
      concA:       new Float64Array(MAX_LOG_POINTS),
      concB:       new Float64Array(MAX_LOG_POINTS),
      concProduct: new Float64Array(MAX_LOG_POINTS),
      count: 0,
      writeIndex: 0
    };
  }

  // ── stepColorChange(dt) ────────────────────
  // Per-particle fixed probabilities. At equilibrium: kf*nReact = kr*nProd.
  // No volume term — Le Chatelier emerges from count imbalance.
  function stepColorChange(dt) {
    var pForward = _kf;  // per-particle forward probability
    var pReverse = _kr;  // per-particle reverse probability
    var i, sp;

    // Build index lists for random assignment
    var reactantIndices = [];
    var productIndices  = [];
    for (i = 0; i < _speciesList.length; i++) {
      if (_speciesList[i].side === 'reactant') { reactantIndices.push(i); }
      else { productIndices.push(i); }
    }

    var fwd = 0;
    var rev = 0;

    for (i = 0; i < _n; i++) {
      sp = _speciesList[_species[i]];
      if (sp.side === 'reactant' && Math.random() < pForward) {
        // Convert to a random product species
        _species[i] = productIndices[Math.floor(Math.random() * productIndices.length)];
        fwd++;
      } else if (sp.side === 'product' && Math.random() < pReverse) {
        // Convert to a random reactant species
        _species[i] = reactantIndices[Math.floor(Math.random() * reactantIndices.length)];
        rev++;
      }
    }

    _forwardEvents += fwd;
    _reverseEvents += rev;
  }

  // ── stepCollisionReaction(dt) ──────────────
  // HL collision-reaction model: particles must physically collide
  // with sufficient kinetic energy for a reaction event to occur.
  function stepCollisionReaction(dt) {
    var nReactantSpecies = 0;
    var i, j;
    for (i = 0; i < _speciesList.length; i++) {
      if (_speciesList[i].side === 'reactant') nReactantSpecies++;
    }

    var radius = 4;
    var minDist = radius * 2;
    var minDistSq = minDist * minDist;
    var fwd = 0, rev = 0, collisions = 0;

    // Check all pairs for collisions
    for (i = 0; i < _n; i++) {
      for (j = i + 1; j < _n; j++) {
        var dx = _x[i] - _x[j];
        var dy = _y[i] - _y[j];
        var distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
          collisions++;
          var sideI = _speciesList[_species[i]].side;
          var sideJ = _speciesList[_species[j]].side;

          // Relative velocity for collision energy
          var dvx = _vx[i] - _vx[j];
          var dvy = _vy[i] - _vy[j];
          var collisionKE = 0.5 * (dvx * dvx + dvy * dvy);

          // Forward: two reactants collide -> both become products
          if (sideI === 'reactant' && sideJ === 'reactant') {
            if (Math.random() < _kf && collisionKE > 0.01) {
              var pIndices = [];
              for (var k = 0; k < _speciesList.length; k++) {
                if (_speciesList[k].side === 'product') pIndices.push(k);
              }
              _species[i] = pIndices[Math.floor(Math.random() * pIndices.length)];
              _species[j] = pIndices[Math.floor(Math.random() * pIndices.length)];
              fwd++;
            }
          }
          // Reverse: two products collide -> both become reactants
          else if (sideI === 'product' && sideJ === 'product') {
            if (Math.random() < _kr && collisionKE > 0.01) {
              var rIndices = [];
              for (var k = 0; k < _speciesList.length; k++) {
                if (_speciesList[k].side === 'reactant') rIndices.push(k);
              }
              _species[i] = rIndices[Math.floor(Math.random() * rIndices.length)];
              _species[j] = rIndices[Math.floor(Math.random() * rIndices.length)];
              rev++;
            }
          }

          // Elastic bounce (always, regardless of reaction)
          var dist = Math.sqrt(distSq) || 1;
          var nx = dx / dist;
          var ny = dy / dist;
          var relV = dvx * nx + dvy * ny;
          if (relV < 0) {
            _vx[i] -= relV * nx;
            _vy[i] -= relV * ny;
            _vx[j] += relV * nx;
            _vy[j] += relV * ny;
          }
          // Separate overlapping
          var overlap = minDist - dist;
          if (overlap > 0) {
            _x[i] += nx * overlap * 0.5;
            _y[i] += ny * overlap * 0.5;
            _x[j] -= nx * overlap * 0.5;
            _y[j] -= ny * overlap * 0.5;
          }
        }
      }
    }

    _forwardEvents += fwd;
    _reverseEvents += rev;
    _collisionCount += collisions;
  }

  // ── step(dt) ───────────────────────────────
  function step(dt) {
    var i;

    // Move particles
    for (i = 0; i < _n; i++) {
      _x[i] += _vx[i] * dt;
      _y[i] += _vy[i] * dt;
    }

    // Elastic wall collisions (4 walls, right wall = piston)
    for (i = 0; i < _n; i++) {
      // Left wall
      if (_x[i] < _bounds.left + 4) {
        _x[i]  = _bounds.left + 4;
        _vx[i] = Math.abs(_vx[i]);
      }
      // Right wall (piston)
      if (_x[i] > _bounds.right - 4) {
        _x[i]  = _bounds.right - 4;
        _vx[i] = -Math.abs(_vx[i]);
      }
      // Top wall
      if (_y[i] < _bounds.top + 4) {
        _y[i]  = _bounds.top + 4;
        _vy[i] = Math.abs(_vy[i]);
      }
      // Bottom wall
      if (_y[i] > _bounds.bottom - 4) {
        _y[i]  = _bounds.bottom - 4;
        _vy[i] = -Math.abs(_vy[i]);
      }
    }

    // Inter-particle elastic collisions (for modes that don't handle them)
    // stepCollisionReaction already does elastic bounces + collision counting
    var needsElasticCollisions = (_reactionData && _reactionData.irreversible) || _mode !== 'collision';
    if (needsElasticCollisions) {
      var radius = 4;
      var minDist = radius * 2;
      var minDistSq = minDist * minDist;
      var frameCollisions = 0;
      for (i = 0; i < _n; i++) {
        for (var j = i + 1; j < _n; j++) {
          var dx = _x[i] - _x[j];
          var dy = _y[i] - _y[j];
          var distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            frameCollisions++;
            var dvx = _vx[i] - _vx[j];
            var dvy = _vy[i] - _vy[j];
            var dist = Math.sqrt(distSq) || 1;
            var nx = dx / dist;
            var ny = dy / dist;
            var relV = dvx * nx + dvy * ny;
            if (relV < 0) {
              _vx[i] -= relV * nx;
              _vy[i] -= relV * ny;
              _vx[j] += relV * nx;
              _vy[j] += relV * ny;
            }
            var overlap = minDist - dist;
            if (overlap > 0) {
              _x[i] += nx * overlap * 0.5;
              _y[i] += ny * overlap * 0.5;
              _x[j] -= nx * overlap * 0.5;
              _y[j] -= ny * overlap * 0.5;
            }
          }
        }
      }
      _collisionCount += frameCollisions;
    }

    // Reaction step
    if (_reactionData && _reactionData.irreversible) {
      stepIrreversible(dt);
    } else if (_mode === 'collision') {
      stepCollisionReaction(dt);
    } else {
      stepColorChange(dt);
    }

    // Record events in rolling buffer
    _forwardBuffer[_bufferIndex] = _forwardEvents;
    _reverseBuffer[_bufferIndex] = _reverseEvents;
    _forwardEvents = 0;
    _reverseEvents = 0;
    _bufferIndex++;
    if (_bufferIndex >= RATE_SMOOTH_FRAMES) {
      _bufferIndex = 0;
      _bufferFull  = true;
    }

    // Record collision count in rolling buffer
    if (_collisionBuffer) {
      _collisionBuffer[_collisionBufIdx] = _collisionCount;
      _collisionCount = 0;
      _collisionBufIdx++;
      if (_collisionBufIdx >= RATE_SMOOTH_FRAMES) {
        _collisionBufIdx = 0;
        _collisionBufFull = true;
      }
    }

    // Record concentration-time data
    _simFrameCount++;
    if (_concTimeLog && _concTimeLog.writeIndex < MAX_LOG_POINTS) {
      var idx = _concTimeLog.writeIndex;
      _concTimeLog.time[idx] = _simFrameCount / 60.0; // seconds

      // Count particles by side
      var nReactA = 0, nReactB = 0, nProd = 0;
      for (i = 0; i < _n; i++) {
        var sp = _speciesList[_species[i]];
        if (sp.side === 'reactant') {
          if (sp.sideIndex === 0) nReactA++;
          else nReactB++;
        } else {
          nProd++;
        }
      }
      _concTimeLog.concA[idx]       = nReactA / CONC_SCALE;
      _concTimeLog.concB[idx]       = nReactB / CONC_SCALE;
      _concTimeLog.concProduct[idx] = nProd / CONC_SCALE;
      _concTimeLog.writeIndex++;
      _concTimeLog.count = _concTimeLog.writeIndex;
    }
  }

  // ── render(ctx) ────────────────────────────
  function render(ctx) {
    var i, sp;
    for (i = 0; i < _n; i++) {
      sp = _speciesList[_species[i]];
      ctx.beginPath();
      ctx.arc(_x[i], _y[i], 4, 0, 2 * Math.PI);
      ctx.fillStyle = sp.color;
      ctx.fill();
    }
  }

  // ── getConcentrations() ────────────────────
  function getConcentrations() {
    var nReact = 0;
    var nProd  = 0;
    var i;
    for (i = 0; i < _n; i++) {
      if (_speciesList[_species[i]].side === 'reactant') { nReact++; }
      else { nProd++; }
    }
    var total = nReact + nProd;
    return {
      reactants: nReact,
      products: nProd,
      reactantFraction: total > 0 ? nReact / total : 0,
      productFraction: total > 0 ? nProd / total : 0
    };
  }

  // ── getRates() ────────────────────────────
  function getRates() {
    var len = _bufferFull ? RATE_SMOOTH_FRAMES : Math.max(_bufferIndex, 1);
    var fSum = 0;
    var rSum = 0;
    var i;
    for (i = 0; i < len; i++) {
      fSum += _forwardBuffer[i];
      rSum += _reverseBuffer[i];
    }
    return {
      forward: fSum / len,
      reverse: rSum / len
    };
  }

  // ── getQ() ────────────────────────────────
  // Reaction quotient using particle fractions (nProd/N, nReact/N)
  // with stoichiometric coefficients as exponents.
  function getQ() {
    var conc = getConcentrations();
    var fProd = conc.productFraction;
    var fReact = conc.reactantFraction;

    var rxn = _reactionData;
    var totalReactCoeff = 0, totalProdCoeff = 0, i;
    for (i = 0; i < rxn.stoich.reactants.length; i++) totalReactCoeff += rxn.stoich.reactants[i].coeff;
    for (i = 0; i < rxn.stoich.products.length; i++) totalProdCoeff += rxn.stoich.products[i].coeff;

    var numerator   = Math.pow(Math.max(fProd, 1e-10), totalProdCoeff);
    var denominator = Math.pow(Math.max(fReact, 1e-10), totalReactCoeff);
    return numerator / denominator;
  }

  // ── getKc() ───────────────────────────────
  // Equilibrium constant at current temperature
  function getKc() {
    if (!_reactionData) return 1;
    // Van't Hoff: ln(K2/K1) = -dH/R * (1/T2 - 1/T1)
    var K1 = _reactionData.Kc_298;
    var dH = _reactionData.dH;
    var lnRatio = -(dH / R_GAS) * (1.0 / _T - 1.0 / 298.0);
    return K1 * Math.exp(lnRatio);
  }

  // ── getKp() ───────────────────────────────
  // Kp = Kc * (RT)^dn  (gas-phase only)
  function getKp() {
    if (!_reactionData) return 1;
    var Kc = getKc();
    var dn = _reactionData.dn || 0;
    return Kc * Math.pow(R_GAS * _T / 1e5, dn);  // P in bar (1e5 Pa)
  }

  // ── getDeltaG() ───────────────────────────
  // ΔG° = -RT ln(Kc)
  function getDeltaG() {
    var Kc = getKc();
    if (Kc <= 0) return 0;
    return -R_GAS * _T * Math.log(Kc);
  }

  // ── isAtEquilibrium() ─────────────────────
  function isAtEquilibrium() {
    var Kc = getKc();
    var Q  = getQ();
    if (Kc === 0) return false;
    var ratio = Q / Kc;
    return ratio > 0.7 && ratio < 1.4;
  }

  // ── getBounds() ───────────────────────────
  function getBounds() {
    return { left: _bounds.left, top: _bounds.top, right: _bounds.right, bottom: _bounds.bottom };
  }

  // ── getMode() / setMode() ─────────────────
  function getMode() { return _mode; }
  function setMode(mode) { _mode = mode; }

  // ── setTemperature(T) ─────────────────────
  function setTemperature(T) {
    var oldT = _T;
    _T = T;
    // Rescale velocities
    if (oldT > 0 && T > 0) {
      var scale = Math.sqrt(T / oldT);
      for (var i = 0; i < _n; i++) {
        _vx[i] *= scale;
        _vy[i] *= scale;
      }
    }
    // Recompute rate constants and equilibrium fraction (equilibrium reactions only)
    if (_reactionData && !_reactionData.irreversible) {
      var rates = computeRateConstants(_reactionData, _T);
      _kf = rates.kf;
      _kr = rates.kr;
      _fEq = rates.fEq;
    }
  }

  // ── setVolume(V) ──────────────────────────
  // Maps volume slider value (0.5-5.0) to piston position
  function setVolume(V) {
    var maxWidth = 840;
    var fraction = V / 5.0;
    var newRight = _bounds.left + (maxWidth - _bounds.left) * fraction;
    _bounds.right = newRight;

    // Clamp particles into new bounds
    for (var i = 0; i < _n; i++) {
      if (_x[i] > _bounds.right - 4) {
        _x[i] = _bounds.right - 4;
        _vx[i] = -Math.abs(_vx[i]);
      }
    }
  }

  // ── perturb(action) ───────────────────────
  // Add or remove reactant/product particles
  function perturb(action) {
    var amount = 20;
    var reactantIndices = [];
    var productIndices  = [];
    var i;
    for (i = 0; i < _speciesList.length; i++) {
      if (_speciesList[i].side === 'reactant') { reactantIndices.push(i); }
      else { productIndices.push(i); }
    }

    var w = _bounds.right - _bounds.left;
    var h = _bounds.bottom - _bounds.top;
    var sigma = Math.sqrt(K_SIM * _T / 1.0);

    if (action === 'addReactant' || action === 'addProduct') {
      var indices = (action === 'addReactant') ? reactantIndices : productIndices;
      var toAdd = Math.min(amount, MAX_PARTICLES - _n);
      for (i = 0; i < toAdd; i++) {
        var sp = indices[Math.floor(Math.random() * indices.length)];
        _species[_n] = sp;
        _x[_n]  = _bounds.left + 6 + Math.random() * (w - 12);
        _y[_n]  = _bounds.top  + 6 + Math.random() * (h - 12);
        _vx[_n] = sigma * gaussRandom();
        _vy[_n] = sigma * gaussRandom();
        _n++;
      }
    } else if (action === 'removeReactant' || action === 'removeProduct') {
      var targetSide = (action === 'removeReactant') ? 'reactant' : 'product';
      var removed = 0;
      // Remove from the end to avoid re-indexing issues
      for (i = _n - 1; i >= 0 && removed < amount; i--) {
        if (_speciesList[_species[i]].side === targetSide) {
          // Swap with last particle
          _n--;
          if (i < _n) {
            _x[i]       = _x[_n];
            _y[i]       = _y[_n];
            _vx[i]      = _vx[_n];
            _vy[i]      = _vy[_n];
            _species[i]  = _species[_n];
          }
          removed++;
        }
      }
    }
  }

  // ── Accessors ─────────────────────────────
  function getSpeciesList()   { return _speciesList; }
  function getParticleCount() { return _n; }
  function getTemperature()   { return _T; }

  // ── Catalyst ──────────────────────────────
  function setCatalyst(active) {
    _catalystActive = !!active;
  }
  function getCatalystActive() {
    return _catalystActive;
  }

  // ── Concentration-time series ─────────────
  function getConcTimeSeries() {
    if (!_concTimeLog) return { time: [], concA: [], concB: [], concProduct: [], count: 0 };
    var c = _concTimeLog.count;
    return {
      time:        Array.prototype.slice.call(_concTimeLog.time, 0, c),
      concA:       Array.prototype.slice.call(_concTimeLog.concA, 0, c),
      concB:       Array.prototype.slice.call(_concTimeLog.concB, 0, c),
      concProduct: Array.prototype.slice.call(_concTimeLog.concProduct, 0, c),
      count: c
    };
  }
  function clearConcTimeSeries() {
    _simFrameCount = 0;
    if (_concTimeLog) {
      _concTimeLog.time        = new Float64Array(MAX_LOG_POINTS);
      _concTimeLog.concA       = new Float64Array(MAX_LOG_POINTS);
      _concTimeLog.concB       = new Float64Array(MAX_LOG_POINTS);
      _concTimeLog.concProduct = new Float64Array(MAX_LOG_POINTS);
      _concTimeLog.count       = 0;
      _concTimeLog.writeIndex  = 0;
    }
  }
  function getSimTime() {
    return _simFrameCount / 60.0;
  }

  // ── MB distribution functions ─────────────
  function getSpeedHistogram(numBins) {
    if (_n === 0) return { bins: [], counts: [], maxSpeed: 0 };
    // Find max speed
    var maxSpeed = 0;
    var i;
    for (i = 0; i < _n; i++) {
      var spd = Math.sqrt(_vx[i] * _vx[i] + _vy[i] * _vy[i]);
      if (spd > maxSpeed) maxSpeed = spd;
    }
    maxSpeed = maxSpeed * 1.1 || 1;  // 10% headroom
    var binWidth = maxSpeed / numBins;
    var counts = new Array(numBins);
    var bins = new Array(numBins);
    for (i = 0; i < numBins; i++) {
      counts[i] = 0;
      bins[i] = (i + 0.5) * binWidth;
    }
    for (i = 0; i < _n; i++) {
      var spd = Math.sqrt(_vx[i] * _vx[i] + _vy[i] * _vy[i]);
      var bin = Math.floor(spd / binWidth);
      if (bin >= numBins) bin = numBins - 1;
      counts[bin]++;
    }
    // Normalize to fraction
    for (i = 0; i < numBins; i++) {
      counts[i] /= (_n * binWidth);  // probability density
    }
    return { bins: bins, counts: counts, maxSpeed: maxSpeed };
  }

  function getMBTheoryCurve(T, numPoints) {
    // 2D Maxwell-Boltzmann speed distribution: f(v) = (m/kT) * v * exp(-mv²/2kT)
    var mass = 1.0;
    var kT = K_SIM * T;
    var maxSpeed = 4.0 * Math.sqrt(kT / mass);  // reasonable upper bound
    var xs = new Array(numPoints);
    var ys = new Array(numPoints);
    for (var i = 0; i < numPoints; i++) {
      var v = (i + 0.5) * maxSpeed / numPoints;
      xs[i] = v;
      ys[i] = (mass / kT) * v * Math.exp(-mass * v * v / (2.0 * kT));
    }
    return { speeds: xs, densities: ys, maxSpeed: maxSpeed };
  }

  function getFractionAboveEa(T) {
    // For 2D gas: fraction = exp(-Ea_sim / (kT))
    // Map real Ea to sim units: Ea_sim = Ea * K_SIM / R_GAS
    if (!_reactionData) return 0;
    var Ea = (_catalystActive && _reactionData.catEa_f != null) ? _reactionData.catEa_f : _reactionData.Ea_f;
    var Ea_sim = Ea * K_SIM / R_GAS;
    return Math.exp(-Ea_sim / (K_SIM * T));
  }

  function getEaThresholdSpeed() {
    // Speed threshold corresponding to Ea: v = sqrt(2 * Ea_sim / m)
    if (!_reactionData) return 0;
    var Ea = (_catalystActive && _reactionData.catEa_f != null) ? _reactionData.catEa_f : _reactionData.Ea_f;
    var Ea_sim = Ea * K_SIM / R_GAS;
    return Math.sqrt(2.0 * Ea_sim / 1.0);  // mass = 1.0
  }

  // ── Collision frequency ───────────────────
  function getCollisionFrequency() {
    if (!_collisionBuffer) return 0;
    var len = _collisionBufFull ? RATE_SMOOTH_FRAMES : Math.max(_collisionBufIdx, 1);
    var sum = 0;
    for (var i = 0; i < len; i++) sum += _collisionBuffer[i];
    return sum / len;
  }

  // ── Particle data (for external rendering) ─
  function getParticleData() {
    return { x: _x, y: _y, vx: _vx, vy: _vy, species: _species, n: _n };
  }

  // ── Get current k for irreversible ────────
  function getCurrentK() {
    if (_reactionData && _reactionData.irreversible) {
      return computeIrreversibleK(_reactionData, _T, _catalystActive);
    }
    return _kf;
  }

  // ── Get reaction data ─────────────────────
  function getReactionData() {
    return _reactionData;
  }

  // ── Public API ─────────────────────────────
  return {
    REACTIONS: REACTIONS,
    CONC_SCALE: CONC_SCALE,
    init: init,
    step: step,
    render: render,
    getConcentrations: getConcentrations,
    getRates: getRates,
    getQ: getQ,
    getKc: getKc,
    getKp: getKp,
    getDeltaG: getDeltaG,
    isAtEquilibrium: isAtEquilibrium,
    getBounds: getBounds,
    getMode: getMode,
    setMode: setMode,
    setTemperature: setTemperature,
    setVolume: setVolume,
    perturb: perturb,
    getSpeciesList: getSpeciesList,
    getParticleCount: getParticleCount,
    getTemperature: getTemperature,
    // New: catalyst
    setCatalyst: setCatalyst,
    getCatalystActive: getCatalystActive,
    // New: concentration-time
    getConcTimeSeries: getConcTimeSeries,
    clearConcTimeSeries: clearConcTimeSeries,
    getSimTime: getSimTime,
    // New: MB distribution
    getSpeedHistogram: getSpeedHistogram,
    getMBTheoryCurve: getMBTheoryCurve,
    getFractionAboveEa: getFractionAboveEa,
    getEaThresholdSpeed: getEaThresholdSpeed,
    // New: collision frequency
    getCollisionFrequency: getCollisionFrequency,
    // New: particle data + accessors
    getParticleData: getParticleData,
    getCurrentK: getCurrentK,
    getReactionData: getReactionData
  };

})();

// Register Reaction fallback data
SimEngine.Data.registerFallback('reaction_presets', SimEngine.Reaction.REACTIONS);

// ─────────────────────────────────────────────
// MODULE: DATA COLLECTOR
// Timed data collection, snapshots, CSV export,
// and parameter sweeps for any simulation.
// ─────────────────────────────────────────────
SimEngine.DataCollector = (function () {

  // ── Private state ───────────────────────────
  var _variables = [];           // registered variable descriptors

  var _runActive = false;        // timed run state
  var _runData = [];
  var _runVarKeys = [];
  var _runTotal = 0;
  var _runCollected = 0;
  var _runFrameCount = 0;
  var _runInterval = 1;

  var _snapshots = [];           // snapshot rows

  var _sweepActive = false;      // sweep state
  var _sweepData = [];
  var _sweepConfig = null;
  var _sweepStep = 0;
  var _sweepSettleCount = 0;
  var _sweepVarKeys = [];


  // ── 1. Variable Registration ────────────────

  function registerVariables(varList) {
    _variables = [];
    for (var i = 0; i < varList.length; i++) {
      _variables.push({
        key:     varList[i].key,
        label:   varList[i].label,
        getter:  varList[i].getter,
        default: !!varList[i].default,
        hl:      !!varList[i].hl
      });
    }
  }

  function getVariables() {
    var copy = [];
    for (var i = 0; i < _variables.length; i++) {
      copy.push({
        key:     _variables[i].key,
        label:   _variables[i].label,
        default: _variables[i].default,
        hl:      _variables[i].hl
      });
    }
    return copy;
  }


  // ── 2. Timed Run Collection ─────────────────

  function startRun(config) {
    var durationSec = config.durationSec || 10;
    var pointCount  = config.pointCount  || 60;
    _runVarKeys     = config.variables   || [];
    _runInterval    = Math.round((durationSec * 60) / pointCount);
    if (_runInterval < 1) { _runInterval = 1; }
    _runTotal       = pointCount;
    _runCollected   = 0;
    _runFrameCount  = 0;
    _runData        = [];
    _runActive      = true;
    SimEngine.State.emit('dataCollectionStart', {
      durationSec: durationSec,
      pointCount: pointCount,
      variables: _runVarKeys
    });
  }

  function _recordRunPoint() {
    var row = {};
    for (var i = 0; i < _variables.length; i++) {
      var v = _variables[i];
      if (_runVarKeys.indexOf(v.key) !== -1) {
        row[v.key] = v.getter();
      }
    }
    _runData.push(row);
    _runCollected++;
  }

  function stopRun() {
    _runActive = false;
    SimEngine.State.emit('dataCollectionStop', {
      collected: _runCollected,
      total: _runTotal
    });
  }

  function isRunning() {
    return _runActive;
  }

  function getProgress() {
    return {
      collected: _runCollected,
      total:     _runTotal,
      percent:   _runTotal > 0 ? Math.round((_runCollected / _runTotal) * 100) : 0
    };
  }

  function getRun() {
    return _runData.slice();
  }


  // ── 3. Snapshots ────────────────────────────

  function recordSnapshot() {
    var row = {};
    for (var i = 0; i < _variables.length; i++) {
      row[_variables[i].key] = _variables[i].getter();
    }
    _snapshots.push(row);
    SimEngine.State.emit('snapshotRecorded', {
      count: _snapshots.length,
      row: row
    });
  }

  function getSnapshots() {
    return _snapshots.slice();
  }


  // ── 4. CSV Generation + Download ────────────

  function _formatValue(key, val) {
    if (val === null || val === undefined) { return ''; }
    if (typeof val !== 'number') { return String(val); }
    if (isNaN(val)) { return 'NaN'; }
    if (!isFinite(val)) { return val > 0 ? 'Infinity' : '-Infinity'; }
    if (val === 0) { return '0'; }

    var abs = Math.abs(val);

    // Scientific notation for very large or very small
    if (abs >= 1e5 || abs < 1e-3) {
      return val.toExponential(4);
    }
    // 4 decimal places for fraction-type keys
    if (key.indexOf('Frac') !== -1 || key.indexOf('frac') !== -1) {
      return val.toFixed(4);
    }
    // 3 decimal places for rate-type keys
    if (key.indexOf('rate') !== -1 || key.indexOf('Rate') !== -1) {
      return val.toFixed(3);
    }
    // 4 significant figures default
    return Number(val.toPrecision(4)).toString();
  }

  function _getKeysForType(dataType) {
    var data;
    if (dataType === 'run')       { data = _runData; }
    else if (dataType === 'snapshots') { data = _snapshots; }
    else if (dataType === 'sweep')     { data = _sweepData; }
    else { return []; }

    if (data.length === 0) { return []; }

    // Collect keys from first row preserving order
    var keys = [];
    var first = data[0];
    for (var k in first) {
      if (first.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    return keys;
  }

  function _labelForKey(key) {
    for (var i = 0; i < _variables.length; i++) {
      if (_variables[i].key === key) { return _variables[i].label; }
    }
    return key;
  }

  function toCSV(dataType) {
    var data;
    if (dataType === 'run')            { data = _runData; }
    else if (dataType === 'snapshots') { data = _snapshots; }
    else if (dataType === 'sweep')     { data = _sweepData; }
    else { return ''; }

    if (data.length === 0) { return ''; }

    var keys = _getKeysForType(dataType);

    // Header row from labels
    var headers = [];
    for (var h = 0; h < keys.length; h++) {
      headers.push(_labelForKey(keys[h]));
    }
    var lines = [headers.join(',')];

    // Data rows
    for (var r = 0; r < data.length; r++) {
      var cells = [];
      for (var c = 0; c < keys.length; c++) {
        cells.push(_formatValue(keys[c], data[r][keys[c]]));
      }
      lines.push(cells.join(','));
    }

    return lines.join('\n');
  }

  function download(filename, dataType) {
    var csv = toCSV(dataType);
    if (!csv) { return; }
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href        = url;
    a.download    = filename || 'data.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearData() {
    _runData    = [];
    _runActive  = false;
    _runCollected = 0;
    _runFrameCount = 0;
    _snapshots  = [];
    _sweepData  = [];
    _sweepActive = false;
    _sweepStep  = 0;
    _sweepSettleCount = 0;
    _sweepConfig = null;
    SimEngine.State.emit('dataCleared', {});
  }


  // ── 5. Parameter Sweep (Teacher Mode) ──────

  function startSweep(config) {
    _sweepConfig = {
      paramKey:     config.paramKey,
      from:         config.from,
      to:           config.to,
      steps:        config.steps,
      settleFrames: config.settleFrames || 60,
      variables:    config.variables || []
    };
    _sweepVarKeys    = _sweepConfig.variables;
    _sweepData       = [];
    _sweepStep       = 0;
    _sweepSettleCount = 0;
    _sweepActive     = true;

    // Set the parameter to its initial value
    SimEngine.State.set(_sweepConfig.paramKey, _sweepConfig.from);

    SimEngine.State.emit('sweepStart', {
      paramKey: _sweepConfig.paramKey,
      from:     _sweepConfig.from,
      to:       _sweepConfig.to,
      steps:    _sweepConfig.steps
    });
  }

  function _sweepParamValue() {
    if (!_sweepConfig || _sweepConfig.steps <= 1) {
      return _sweepConfig ? _sweepConfig.from : 0;
    }
    var frac = _sweepStep / (_sweepConfig.steps - 1);
    return _sweepConfig.from + frac * (_sweepConfig.to - _sweepConfig.from);
  }

  function _tickSweep() {
    if (!_sweepActive || !_sweepConfig) { return; }

    _sweepSettleCount++;

    if (_sweepSettleCount >= _sweepConfig.settleFrames) {
      // Record data point for this step
      var row = {};
      row[_sweepConfig.paramKey] = _sweepParamValue();
      for (var i = 0; i < _variables.length; i++) {
        var v = _variables[i];
        if (_sweepVarKeys.indexOf(v.key) !== -1) {
          row[v.key] = v.getter();
        }
      }
      _sweepData.push(row);

      // Advance to next step
      _sweepStep++;
      if (_sweepStep >= _sweepConfig.steps) {
        _sweepActive = false;
        SimEngine.State.emit('sweepComplete', {
          steps: _sweepConfig.steps,
          data: _sweepData.slice()
        });
        return;
      }

      // Emit sweep progress
      SimEngine.State.emit('sweepProgress', {
        step: _sweepStep,
        total: _sweepConfig.steps,
        percent: Math.round((_sweepStep / _sweepConfig.steps) * 100)
      });

      // Set next parameter value and reset settle counter
      _sweepSettleCount = 0;
      SimEngine.State.set(_sweepConfig.paramKey, _sweepParamValue());
    }
  }

  function isSweeping() {
    return _sweepActive;
  }

  function getSweepProgress() {
    var total = _sweepConfig ? _sweepConfig.steps : 0;
    return {
      step:    _sweepStep,
      total:   total,
      percent: total > 0 ? Math.round((_sweepStep / total) * 100) : 0
    };
  }

  function getSweepData() {
    return _sweepData.slice();
  }


  // ── Tick (called every frame) ───────────────

  function tick() {
    // Process timed run
    if (_runActive) {
      _runFrameCount++;
      if (_runFrameCount >= _runInterval) {
        _runFrameCount = 0;
        _recordRunPoint();
        if (_runCollected >= _runTotal) {
          _runActive = false;
          SimEngine.State.emit('dataCollectionComplete', {
            collected: _runCollected,
            total: _runTotal
          });
        } else {
          SimEngine.State.emit('dataCollectionProgress', {
            collected: _runCollected,
            total: _runTotal,
            percent: Math.round((_runCollected / _runTotal) * 100)
          });
        }
      }
    }
    // Process sweep
    _tickSweep();
  }


  // ── Public API ──────────────────────────────
  return {
    registerVariables: registerVariables,
    getVariables:      getVariables,
    startRun:          startRun,
    stopRun:           stopRun,
    tick:              tick,
    isRunning:         isRunning,
    getProgress:       getProgress,
    getRun:            getRun,
    recordSnapshot:    recordSnapshot,
    getSnapshots:      getSnapshots,
    toCSV:             toCSV,
    download:          download,
    clearData:         clearData,
    startSweep:        startSweep,
    isSweeping:        isSweeping,
    getSweepProgress:  getSweepProgress,
    getSweepData:      getSweepData
  };

})();


// MODULE 7: TITRATION
// pH calculation engine for acid-base titrations.
// Precomputes full titration curves from acid/base
// properties, concentrations, and volumes.
SimEngine.Titration = (function () {

  // ── Acid/Base Database ────────────────────────

  var Kw = 1.0e-14;

  var ACIDS = {
    HCl:      { name: 'Hydrochloric acid', formula: 'HCl',      strong: true,  Ka: [Infinity],                   hl: false },
    H2SO4:    { name: 'Sulfuric acid',     formula: 'H\u2082SO\u2084', strong: true, Ka: [Infinity, 0.012],       hl: true  },
    HNO3:     { name: 'Nitric acid',       formula: 'HNO\u2083',  strong: true,  Ka: [Infinity],                   hl: false },
    CH3COOH:  { name: 'Ethanoic acid',      formula: 'CH\u2083COOH', strong: false, Ka: [1.74e-5],                 hl: false },
    H3PO4:    { name: 'Phosphoric acid',   formula: 'H\u2083PO\u2084', strong: false, Ka: [7.5e-3, 6.2e-8, 4.8e-13], hl: true },
    C6H8O7:   { name: 'Citric acid',       formula: 'C\u2086H\u2088O\u2087', strong: false, Ka: [7.4e-4, 1.7e-5, 4.0e-7], hl: true }
  };

  var BASES = {
    NaOH:   { name: 'Sodium hydroxide',  formula: 'NaOH',        strong: true,  Kb: Infinity,  hl: false },
    KOH:    { name: 'Potassium hydroxide', formula: 'KOH',       strong: true,  Kb: Infinity,  hl: false },
    NH3:    { name: 'Ammonia',            formula: 'NH\u2083',    strong: false, Kb: 1.8e-5,   hl: false },
    Na2CO3: { name: 'Sodium carbonate',   formula: 'Na\u2082CO\u2083', strong: false, Kb: 2.1e-4, hl: false }
  };

  var PRESETS = [
    { label: 'Strong acid / Strong base',   acidKey: 'HCl',     baseKey: 'NaOH',  acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Weak acid / Strong base',     acidKey: 'CH3COOH', baseKey: 'NaOH',  acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Strong acid / Weak base',     acidKey: 'HCl',     baseKey: 'NH3',   acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Weak acid / Weak base',       acidKey: 'CH3COOH', baseKey: 'NH3',   acidConc: 0.10, baseConc: 0.10, acidVol: 25 }
  ];

  var INDICATORS = {
    none:             { name: 'None',              pHLow: 0,   pHHigh: 14,  colorLow: null,      colorHigh: null     },
    phenolphthalein:  { name: 'Phenolphthalein',   pHLow: 8.2, pHHigh: 10.0, colorLow: '#F8FAFC', colorHigh: '#EC4899' },
    methylOrange:     { name: 'Methyl orange',     pHLow: 3.1, pHHigh: 4.4, colorLow: '#EF4444', colorHigh: '#EAB308' },
    bromothymolBlue:  { name: 'Bromothymol blue',  pHLow: 6.0, pHHigh: 7.6, colorLow: '#EAB308', colorHigh: '#3B82F6' }
  };

  // ── State ─────────────────────────────────────

  var _acid = null;
  var _base = null;
  var _acidKey = '';
  var _baseKey = '';
  var _acidConc = 0.10;
  var _baseConc = 0.10;
  var _acidVol = 25;
  var _curve = [];
  var _maxVol = 50;

  // ── Init ──────────────────────────────────────

  function init(config) {
    _acidKey  = config.acidKey  || 'HCl';
    _baseKey  = config.baseKey  || 'NaOH';
    _acidConc = config.acidConc || 0.10;
    _baseConc = config.baseConc || 0.10;
    _acidVol  = config.acidVol  || 25;
    _acid = ACIDS[_acidKey];
    _base = BASES[_baseKey];
    _maxVol = (_acidConc * _acidVol / _baseConc) * 2.5;
    if (_maxVol < 10) _maxVol = 10;
    if (_maxVol > 100) _maxVol = 100;
    _curve = [];
    computeCurve();
  }

  // ── pH Calculation Helpers ────────────────────

  function _clampPH(pH) {
    return Math.max(0, Math.min(14, pH));
  }

  function _weakAcidPH(Ka, C) {
    if (C <= 0) return 7;
    var disc = Ka * Ka + 4 * Ka * C;
    var x = (-Ka + Math.sqrt(disc)) / 2;
    return _clampPH(-Math.log10(Math.max(x, 1e-15)));
  }

  function _weakBasePH(Kb, C) {
    if (C <= 0) return 7;
    var disc = Kb * Kb + 4 * Kb * C;
    var x = (-Kb + Math.sqrt(disc)) / 2;
    var pOH = -Math.log10(Math.max(x, 1e-15));
    return _clampPH(14 - pOH);
  }

  function _hendersonHasselbalch(pKa, concA, concHA) {
    if (concHA <= 0 || concA <= 0) return null;
    return pKa + Math.log10(concA / concHA);
  }

  // ── pH at Volume ──────────────────────────────

  function _pHAtVolume_SA_SB(vol) {
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (molBase < molAcid - 1e-12) {
      var excessH = (molAcid - molBase) / totalVol;
      return { pH: _clampPH(-Math.log10(excessH)), region: vol < 0.5 ? 'initial' : 'pre-equiv' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      return { pH: 7.0, region: 'equivalence' };
    } else {
      var excessOH = (molBase - molAcid) / totalVol;
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }
  }

  function _pHAtVolume_WA_SB(vol) {
    var Ka = _acid.Ka[0];
    var pKa = -Math.log10(Ka);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      var concHA = (molAcid - molBase) / totalVol;
      var concA  = molBase / totalVol;
      var pH = _hendersonHasselbalch(pKa, concA, concHA);
      var halfEquivVol = molAcid / _baseConc * 1000 / 2;
      var region = (Math.abs(vol - halfEquivVol) < 0.5) ? 'half-equiv' : 'buffer';
      return { pH: _clampPH(pH), region: region };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      var Cb = molAcid / totalVol;
      var Kb = Kw / Ka;
      return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
    } else {
      var excessOH = (molBase - molAcid) / totalVol;
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }
  }

  function _pHAtVolume_SA_WB(vol) {
    var Kb = _base.Kb;
    var Ka_conj = Kw / Kb;
    var pKa_conj = -Math.log10(Ka_conj);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      return { pH: _clampPH(-Math.log10(_acidConc)), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      var excessH = (molAcid - molBase) / totalVol;
      return { pH: _clampPH(-Math.log10(excessH)), region: 'pre-equiv' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      var Cconj = molBase / totalVol;
      return { pH: _weakAcidPH(Ka_conj, Cconj), region: 'equivalence' };
    } else {
      var concB   = (molBase - molAcid) / totalVol;
      var concBH  = molAcid / totalVol;
      var pH = pKa_conj + Math.log10(concB / concBH);
      var halfEquivVol = molAcid / _baseConc * 1000;
      var pastHalf = (vol - halfEquivVol);
      var totalExcess = _maxVol - halfEquivVol;
      var region = (pastHalf > 0 && pastHalf < totalExcess * 0.5) ? 'buffer' : 'excess';
      return { pH: _clampPH(pH), region: region };
    }
  }

  function _pHAtVolume_WA_WB(vol) {
    var Ka = _acid.Ka[0];
    var Kb = _base.Kb;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      var concHA = (molAcid - molBase) / totalVol;
      var concA  = molBase / totalVol;
      var pKa = -Math.log10(Ka);
      var pH = _hendersonHasselbalch(pKa, concA, concHA);
      return { pH: _clampPH(pH), region: 'buffer' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      var pKa = -Math.log10(Ka);
      var pKb = -Math.log10(Kb);
      var pH = 7 + (pKa - pKb) / 2;
      return { pH: _clampPH(pH), region: 'equivalence' };
    } else {
      var excessBase = (molBase - molAcid) / totalVol;
      return { pH: _weakBasePH(Kb, excessBase), region: 'excess' };
    }
  }

  // ── Polyprotic Acid Titration (HL) ────────────

  function _pHAtVolume_polyprotic_SB(vol) {
    var Kas = _acid.Ka;
    var nProtons = Kas.length;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    var eqMols = [];
    for (var p = 0; p < nProtons; p++) {
      eqMols.push(molAcid * (p + 1));
    }

    // Helper: is this Ka effectively a strong proton?
    function _isStrongKa(Ka) { return Ka >= 1e6; }

    if (vol < 0.01) {
      if (_isStrongKa(Kas[0])) {
        // Strong first proton: treat as strong acid
        var hConc = _acidConc;
        return { pH: _clampPH(-Math.log10(hConc)), region: 'initial' };
      }
      return { pH: _weakAcidPH(Kas[0], _acidConc), region: 'initial' };
    }

    // Find which proton we're neutralizing
    var protonIndex = 0;
    for (var p = 0; p < nProtons; p++) {
      if (molBase < eqMols[p] + 1e-12) {
        protonIndex = p;
        break;
      }
      if (p === nProtons - 1) {
        protonIndex = nProtons;
      }
    }

    if (protonIndex >= nProtons) {
      var excessOH = (molBase - eqMols[nProtons - 1]) / totalVol;
      if (excessOH < 1e-12) {
        var Kb = Kw / Kas[nProtons - 1];
        var Cb = molAcid / totalVol;
        return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
      }
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }

    // At an equivalence point
    if (Math.abs(molBase - eqMols[protonIndex]) < 1e-12) {
      if (protonIndex < nProtons - 1) {
        // Between proton i and i+1: pH = avg(pKa_i, pKa_{i+1})
        // But if Ka_i is strong (Infinity), use Ka2 equilibrium instead
        if (_isStrongKa(Kas[protonIndex])) {
          // At eq1 of strong/weak diprotic: intermediate species dominates
          // pH from Ka2 equilibrium of the intermediate (e.g., HSO4-)
          var Ka2 = Kas[protonIndex + 1];
          var Cb = molAcid / totalVol;
          return { pH: _weakAcidPH(Ka2, Cb), region: 'equivalence' };
        }
        var pKa1 = -Math.log10(Kas[protonIndex]);
        var pKa2 = -Math.log10(Kas[protonIndex + 1]);
        return { pH: _clampPH((pKa1 + pKa2) / 2), region: 'equivalence' };
      } else {
        var Kb = Kw / Kas[protonIndex];
        var Cb = molAcid / totalVol;
        return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
      }
    }

    // Buffer region for current proton
    var prevEqMol = protonIndex > 0 ? eqMols[protonIndex - 1] : 0;
    var molesThisProton = molBase - prevEqMol;
    var Ka = Kas[protonIndex];

    // Strong proton: treat as excess H+ (not buffer)
    if (_isStrongKa(Ka)) {
      var excessH = (molAcid - molBase) / totalVol;
      if (excessH < 1e-12) excessH = 1e-12;
      var halfMol = (prevEqMol + eqMols[protonIndex]) / 2;
      var isHalf = Math.abs(molBase - halfMol) < molAcid * 0.02;
      return { pH: _clampPH(-Math.log10(excessH)), region: isHalf ? 'half-equiv' : 'buffer' };
    }

    var pKa = -Math.log10(Ka);
    var concAcidForm = (molAcid - molesThisProton) / totalVol;
    var concBaseForm = molesThisProton / totalVol;

    if (concAcidForm <= 0 || concBaseForm <= 0) {
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'buffer' };
    }

    var pH = _hendersonHasselbalch(pKa, concBaseForm, concAcidForm);
    var halfMol = (prevEqMol + eqMols[protonIndex]) / 2;
    var isHalf = Math.abs(molBase - halfMol) < molAcid * 0.02;
    return { pH: _clampPH(pH), region: isHalf ? 'half-equiv' : 'buffer' };
  }

  // ── Dispatcher ────────────────────────────────

  function _getPHAtVolume(vol) {
    var acidStrong = _acid.strong;
    var baseStrong = _base.strong;
    var isPolyprotic = _acid.Ka.length > 1;

    var result;
    if (isPolyprotic && baseStrong)          result = _pHAtVolume_polyprotic_SB(vol);
    else if (acidStrong && baseStrong)       result = _pHAtVolume_SA_SB(vol);
    else if (!acidStrong && baseStrong)      result = _pHAtVolume_WA_SB(vol);
    else if (acidStrong && !baseStrong)      result = _pHAtVolume_SA_WB(vol);
    else                                     result = _pHAtVolume_WA_WB(vol);

    var pH = result.pH;
    var pOH = 14 - pH;
    var hConc = Math.pow(10, -pH);
    var ohConc = Math.pow(10, -pOH);

    var haConc = 0;
    var aConc = 0;
    if (!_acid.strong) {
      var molAcid = _acidConc * _acidVol / 1000;
      var molBase = _baseConc * vol / 1000;
      var totalVol = (_acidVol + vol) / 1000;
      haConc = Math.max(0, (molAcid - molBase) / totalVol);
      aConc  = Math.min(molAcid, molBase) / totalVol;
    }

    return {
      volume:  vol,
      pH:      pH,
      pOH:     pOH,
      hConc:   hConc,
      ohConc:  ohConc,
      haConc:  haConc,
      aConc:   aConc,
      region:  result.region
    };
  }

  function getPHAtVolume(vol) {
    return _getPHAtVolume(vol);
  }

  // ── Curve Generation ────────────────────────────

  function computeCurve() {
    _curve = [];
    var step = 0.1;
    for (var v = 0; v <= _maxVol + step / 2; v += step) {
      _curve.push(_getPHAtVolume(Math.round(v * 10) / 10));
    }
    return _curve;
  }

  function getCurve() {
    return _curve.slice();
  }

  function getMaxVolume() {
    return _maxVol;
  }

  // ── Analysis Methods ──────────────────────────

  function getEquivalencePoints() {
    var nProtons = _acid.Ka.length;
    var points = [];
    for (var p = 1; p <= nProtons; p++) {
      var eqVol = (_acidConc * _acidVol * p) / _baseConc;
      var pt = _getPHAtVolume(eqVol);
      points.push({ volume: eqVol, pH: pt.pH, proton: p });
    }
    return points;
  }

  function getHalfEquivalencePoints() {
    if (_acid.strong) return [];
    var nProtons = _acid.Ka.length;
    var points = [];
    for (var p = 0; p < nProtons; p++) {
      var eqVol = (_acidConc * _acidVol * (p + 1)) / _baseConc;
      var prevEqVol = p > 0 ? (_acidConc * _acidVol * p) / _baseConc : 0;
      var halfVol = (prevEqVol + eqVol) / 2;
      var pKa = -Math.log10(_acid.Ka[p]);
      points.push({ volume: halfVol, pH: pKa, pKa: pKa, proton: p + 1 });
    }
    return points;
  }

  function getBufferRange() {
    if (_acid.strong && _base.strong) return null;
    var eqVol = (_acidConc * _acidVol) / _baseConc;
    return { startVol: eqVol * 0.1, endVol: eqVol * 0.9 };
  }

  function getDerivative() {
    var deriv = [];
    for (var i = 1; i < _curve.length; i++) {
      var dV = _curve[i].volume - _curve[i - 1].volume;
      var dpH = _curve[i].pH - _curve[i - 1].pH;
      if (dV > 0) {
        deriv.push({
          volume: (_curve[i].volume + _curve[i - 1].volume) / 2,
          dPHdV: dpH / dV
        });
      }
    }
    return deriv;
  }

  function getHendersonHasselbalch(vol) {
    if (_acid.strong) return null;
    var Ka = _acid.Ka[0];
    var pKa = -Math.log10(Ka);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (molBase >= molAcid) return null;
    var concHA = (molAcid - molBase) / totalVol;
    var concA  = molBase / totalVol;
    if (concHA <= 0 || concA <= 0) return null;

    var ratioLog = Math.log10(concA / concHA);
    return {
      pKa: pKa,
      concA: concA,
      concHA: concHA,
      ratioLog: ratioLog,
      pH: pKa + ratioLog
    };
  }

  // ── Species Counts for Particle View ──────────

  function getSpeciesCounts(vol, maxParticles) {
    maxParticles = maxParticles || 80;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;
    var pt = _getPHAtVolume(vol);

    var HA = 0, Hplus = 0, Aminus = 0, OHminus = 0, water = 0, spectator = 0;

    if (_acid.strong) {
      if (molBase < molAcid) {
        Hplus = molAcid - molBase;
        Aminus = molAcid;
        spectator = molBase;
      } else {
        Aminus = molAcid;
        OHminus = molBase - molAcid;
        spectator = molAcid;
        water = Math.min(molAcid, molBase);
      }
    } else {
      var concHA = pt.haConc;
      var concA  = pt.aConc;
      HA = concHA * totalVol;
      Aminus = concA * totalVol;
      Hplus = pt.hConc * totalVol;
      OHminus = pt.ohConc * totalVol;
      spectator = Math.min(molBase, molAcid);
      water = Math.min(molAcid, molBase) - Aminus;
      if (water < 0) water = 0;
    }

    var total = HA + Hplus + Aminus + OHminus + spectator;
    if (total <= 0) return { HA: 0, H: 0, A: 0, OH: 0, water: 0, spectator: 0 };
    var scale = maxParticles / total;

    return {
      HA:        Math.round(HA * scale),
      H:         Math.max(0, Math.round(Hplus * scale)),
      A:         Math.round(Aminus * scale),
      OH:        Math.max(0, Math.round(OHminus * scale)),
      water:     Math.round(Math.min(water * scale, 10)),
      spectator: Math.round(spectator * scale * 0.3)
    };
  }

  // ── Public API ────────────────────────────────

  return {
    ACIDS:                    ACIDS,
    BASES:                    BASES,
    PRESETS:                  PRESETS,
    INDICATORS:               INDICATORS,
    Kw:                       Kw,
    init:                     init,
    computeCurve:             computeCurve,
    getCurve:                 getCurve,
    getPHAtVolume:            getPHAtVolume,
    getMaxVolume:             getMaxVolume,
    getEquivalencePoints:     getEquivalencePoints,
    getHalfEquivalencePoints: getHalfEquivalencePoints,
    getBufferRange:           getBufferRange,
    getDerivative:            getDerivative,
    getHendersonHasselbalch:  getHendersonHasselbalch,
    getSpeciesCounts:         getSpeciesCounts
  };

})();

// Register Titration fallback data
SimEngine.Data.registerFallback('titration_acids', SimEngine.Titration.ACIDS);
SimEngine.Data.registerFallback('titration_bases', SimEngine.Titration.BASES);
SimEngine.Data.registerFallback('titration_indicators', SimEngine.Titration.INDICATORS);
SimEngine.Data.registerFallback('titration_presets', SimEngine.Titration.PRESETS);

// ─────────────────────────────────────────────
// MODULE 8: ELECTROCHEM
// Half-cell database, E° calculations, electrolysis
// discharge rules, Faraday's law, and activity series.
// ─────────────────────────────────────────────
SimEngine.Electrochem = (function () {

  var F = 96485; // Faraday constant, C/mol

  // ── Half-Cell Database (IB Data Booklet) ────

  var HALF_CELLS = [
    { key: 'Li',    ion: 'Li\u207A',        metal: 'Li',  formula: 'Li\u207A/Li',
      halfReaction: 'Li\u207A + e\u207B \u2192 Li',
      E: -3.04, electrons: 1, state: 'solid', molarMass: 6.94,
      color: '#A855F7' },
    { key: 'K',     ion: 'K\u207A',         metal: 'K',   formula: 'K\u207A/K',
      halfReaction: 'K\u207A + e\u207B \u2192 K',
      E: -2.92, electrons: 1, state: 'solid', molarMass: 39.10,
      color: '#8B5CF6' },
    { key: 'Ca',    ion: 'Ca\u00B2\u207A',  metal: 'Ca',  formula: 'Ca\u00B2\u207A/Ca',
      halfReaction: 'Ca\u00B2\u207A + 2e\u207B \u2192 Ca',
      E: -2.87, electrons: 2, state: 'solid', molarMass: 40.08,
      color: '#F59E0B' },
    { key: 'Na',    ion: 'Na\u207A',        metal: 'Na',  formula: 'Na\u207A/Na',
      halfReaction: 'Na\u207A + e\u207B \u2192 Na',
      E: -2.71, electrons: 1, state: 'solid', molarMass: 22.99,
      color: '#F97316' },
    { key: 'Mg',    ion: 'Mg\u00B2\u207A',  metal: 'Mg',  formula: 'Mg\u00B2\u207A/Mg',
      halfReaction: 'Mg\u00B2\u207A + 2e\u207B \u2192 Mg',
      E: -2.37, electrons: 2, state: 'solid', molarMass: 24.31,
      color: '#84CC16' },
    { key: 'Al',    ion: 'Al\u00B3\u207A',  metal: 'Al',  formula: 'Al\u00B3\u207A/Al',
      halfReaction: 'Al\u00B3\u207A + 3e\u207B \u2192 Al',
      E: -1.66, electrons: 3, state: 'solid', molarMass: 26.98,
      color: '#CBD5E1' },
    { key: 'Mn',    ion: 'Mn\u00B2\u207A',  metal: 'Mn',  formula: 'Mn\u00B2\u207A/Mn',
      halfReaction: 'Mn\u00B2\u207A + 2e\u207B \u2192 Mn',
      E: -1.18, electrons: 2, state: 'solid', molarMass: 54.94,
      color: '#A78BFA' },
    { key: 'Zn',    ion: 'Zn\u00B2\u207A',  metal: 'Zn',  formula: 'Zn\u00B2\u207A/Zn',
      halfReaction: 'Zn\u00B2\u207A + 2e\u207B \u2192 Zn',
      E: -0.76, electrons: 2, state: 'solid', molarMass: 65.38,
      color: '#94A3B8' },
    { key: 'Fe',    ion: 'Fe\u00B2\u207A',  metal: 'Fe',  formula: 'Fe\u00B2\u207A/Fe',
      halfReaction: 'Fe\u00B2\u207A + 2e\u207B \u2192 Fe',
      E: -0.44, electrons: 2, state: 'solid', molarMass: 55.85,
      color: '#78716C' },
    { key: 'Co',    ion: 'Co\u00B2\u207A',  metal: 'Co',  formula: 'Co\u00B2\u207A/Co',
      halfReaction: 'Co\u00B2\u207A + 2e\u207B \u2192 Co',
      E: -0.28, electrons: 2, state: 'solid', molarMass: 58.93,
      color: '#6366F1' },
    { key: 'Ni',    ion: 'Ni\u00B2\u207A',  metal: 'Ni',  formula: 'Ni\u00B2\u207A/Ni',
      halfReaction: 'Ni\u00B2\u207A + 2e\u207B \u2192 Ni',
      E: -0.26, electrons: 2, state: 'solid', molarMass: 58.69,
      color: '#22C55E' },
    { key: 'Sn',    ion: 'Sn\u00B2\u207A',  metal: 'Sn',  formula: 'Sn\u00B2\u207A/Sn',
      halfReaction: 'Sn\u00B2\u207A + 2e\u207B \u2192 Sn',
      E: -0.14, electrons: 2, state: 'solid', molarMass: 118.71,
      color: '#9CA3AF' },
    { key: 'Pb',    ion: 'Pb\u00B2\u207A',  metal: 'Pb',  formula: 'Pb\u00B2\u207A/Pb',
      halfReaction: 'Pb\u00B2\u207A + 2e\u207B \u2192 Pb',
      E: -0.13, electrons: 2, state: 'solid', molarMass: 207.2,
      color: '#6B7280' },
    { key: 'H2',    ion: 'H\u207A',         metal: 'H\u2082', formula: 'H\u207A/H\u2082',
      halfReaction: '2H\u207A + 2e\u207B \u2192 H\u2082',
      E: 0.00, electrons: 2, state: 'gas', molarMass: 2.02,
      color: '#EF4444' },
    { key: 'Cu',    ion: 'Cu\u00B2\u207A',  metal: 'Cu',  formula: 'Cu\u00B2\u207A/Cu',
      halfReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu',
      E: +0.34, electrons: 2, state: 'solid', molarMass: 63.55,
      color: '#D97706' },
    { key: 'I2',    ion: 'I\u207B',         metal: 'I\u2082', formula: 'I\u2082/I\u207B',
      halfReaction: 'I\u2082 + 2e\u207B \u2192 2I\u207B',
      E: +0.54, electrons: 2, state: 'solid', molarMass: 253.81,
      color: '#7C3AED' },
    { key: 'Ag',    ion: 'Ag\u207A',        metal: 'Ag',  formula: 'Ag\u207A/Ag',
      halfReaction: 'Ag\u207A + e\u207B \u2192 Ag',
      E: +0.80, electrons: 1, state: 'solid', molarMass: 107.87,
      color: '#D1D5DB' },
    { key: 'Fe3',   ion: 'Fe\u00B3\u207A',  metal: 'Fe\u00B2\u207A', formula: 'Fe\u00B3\u207A/Fe\u00B2\u207A',
      halfReaction: 'Fe\u00B3\u207A + e\u207B \u2192 Fe\u00B2\u207A',
      E: +0.77, electrons: 1, state: 'aqueous', molarMass: 55.85,
      color: '#B45309' },
    { key: 'Br2',   ion: 'Br\u207B',        metal: 'Br\u2082', formula: 'Br\u2082/Br\u207B',
      halfReaction: 'Br\u2082 + 2e\u207B \u2192 2Br\u207B',
      E: +1.07, electrons: 2, state: 'liquid', molarMass: 159.81,
      color: '#B91C1C' },
    { key: 'Cr2O7', ion: 'Cr\u2082O\u2087\u00B2\u207B', metal: 'Cr\u00B3\u207A', formula: 'Cr\u2082O\u2087\u00B2\u207B/Cr\u00B3\u207A',
      halfReaction: 'Cr\u2082O\u2087\u00B2\u207B + 14H\u207A + 6e\u207B \u2192 2Cr\u00B3\u207A + 7H\u2082O',
      E: +1.33, electrons: 6, state: 'aqueous', molarMass: 52.00,
      color: '#EA580C' },
    { key: 'Cl2',   ion: 'Cl\u207B',        metal: 'Cl\u2082', formula: 'Cl\u2082/Cl\u207B',
      halfReaction: 'Cl\u2082 + 2e\u207B \u2192 2Cl\u207B',
      E: +1.36, electrons: 2, state: 'gas', molarMass: 70.91,
      color: '#10B981' },
    { key: 'Au',    ion: 'Au\u00B3\u207A',  metal: 'Au',  formula: 'Au\u00B3\u207A/Au',
      halfReaction: 'Au\u00B3\u207A + 3e\u207B \u2192 Au',
      E: +1.50, electrons: 3, state: 'solid', molarMass: 196.97,
      color: '#F59E0B' },
    { key: 'MnO4',  ion: 'MnO\u2084\u207B', metal: 'Mn\u00B2\u207A', formula: 'MnO\u2084\u207B/Mn\u00B2\u207A',
      halfReaction: 'MnO\u2084\u207B + 8H\u207A + 5e\u207B \u2192 Mn\u00B2\u207A + 4H\u2082O',
      E: +1.51, electrons: 5, state: 'aqueous', molarMass: 54.94,
      color: '#7C3AED' },
    { key: 'F2',    ion: 'F\u207B',         metal: 'F\u2082', formula: 'F\u2082/F\u207B',
      halfReaction: 'F\u2082 + 2e\u207B \u2192 2F\u207B',
      E: +2.87, electrons: 2, state: 'gas', molarMass: 38.00,
      color: '#FDE047' }
  ];

  // ── Lookup helper ────────────────────────────

  var _halfCellMap = {};
  for (var i = 0; i < HALF_CELLS.length; i++) {
    _halfCellMap[HALF_CELLS[i].key] = HALF_CELLS[i];
  }

  function getHalfCell(key) {
    return _halfCellMap[key] || null;
  }

  // ── E°cell Calculation ───────────────────────

  function calculateCell(keyA, keyB) {
    var a = getHalfCell(keyA);
    var b = getHalfCell(keyB);
    if (!a || !b) return null;

    var cathode, anode;
    if (a.E >= b.E) {
      cathode = a;
      anode = b;
    } else {
      cathode = b;
      anode = a;
    }

    var eCell = cathode.E - anode.E;

    // Balance electron transfer (LCM of both electron counts)
    var nCathode = cathode.electrons;
    var nAnode = anode.electrons;
    var lcm = (nCathode * nAnode) / _gcd(nCathode, nAnode);

    // Cell notation: anode | anode ion || cathode ion | cathode
    var anodeState = anode.state === 'aqueous' ? 'aq' : anode.state === 'gas' ? 'g' : 's';
    var cathodeState = cathode.state === 'aqueous' ? 'aq' : cathode.state === 'gas' ? 'g' : 's';
    var cellNotation = anode.metal + '(' + anodeState + ') | ' +
                       anode.ion + '(aq) || ' +
                       cathode.ion + '(aq) | ' +
                       cathode.metal + '(' + cathodeState + ')';

    return {
      cathode:         cathode,
      anode:           anode,
      eCell:           Math.round(eCell * 100) / 100,
      spontaneous:     eCell > 0,
      cellNotation:    cellNotation,
      cathodeReaction: cathode.halfReaction,
      anodeReaction:   _reverseReaction(anode.halfReaction),
      electronTransfer: lcm
    };
  }

  function _gcd(a, b) {
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  function _reverseReaction(reaction) {
    var parts = reaction.split(' \u2192 ');
    if (parts.length === 2) return parts[1] + ' \u2192 ' + parts[0];
    return reaction;
  }

  // ── Activity Series ──────────────────────────

  function getActivitySeries() {
    var metals = [];
    for (var i = 0; i < HALF_CELLS.length; i++) {
      var hc = HALF_CELLS[i];
      if (hc.state === 'solid') {
        metals.push({ key: hc.key, metal: hc.metal, E: hc.E, ion: hc.ion, color: hc.color });
      }
    }
    metals.sort(function (a, b) { return a.E - b.E; });
    return metals;
  }

  // ── Electrolysis Presets ─────────────────────

  var ELECTROLYTES = [
    { key: 'NaCl_molten',   label: 'NaCl (molten)',            cation: 'Na', anion: 'Cl', state: 'molten', concentration: 'n/a', electrode: 'inert',
      cathodeProduct: 'Na(l)',   anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: 'Na\u207A + e\u207B \u2192 Na(l)',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'PbBr2_molten',  label: 'PbBr\u2082 (molten)',     cation: 'Pb', anion: 'Br', state: 'molten', concentration: 'n/a', electrode: 'inert',
      cathodeProduct: 'Pb(l)',   anodeProduct: 'Br\u2082(l)',
      cathodeReaction: 'Pb\u00B2\u207A + 2e\u207B \u2192 Pb(l)',
      anodeReaction:   '2Br\u207B \u2192 Br\u2082(l) + 2e\u207B' },
    { key: 'CuCl2_aq',      label: 'CuCl\u2082 (aqueous)',    cation: 'Cu', anion: 'Cl', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Cu(s)',   anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'CuSO4_aq',      label: 'CuSO\u2084 (aq, inert electrodes)', cation: 'Cu', anion: 'SO4', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Cu(s)',   anodeProduct: 'O\u2082(g)',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'NaCl_conc',     label: 'NaCl (aq, concentrated)', cation: 'Na', anion: 'Cl', state: 'aqueous', concentration: 'concentrated', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'NaCl_dilute',   label: 'NaCl (aq, dilute)',       cation: 'Na', anion: 'Cl', state: 'aqueous', concentration: 'dilute', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'O\u2082(g)',
      cathodeReaction: '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'H2SO4_dilute',  label: 'H\u2082SO\u2084 (aq, dilute)', cation: 'H2', anion: 'SO4', state: 'aqueous', concentration: 'dilute', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'O\u2082(g)',
      cathodeReaction: '2H\u207A + 2e\u207B \u2192 H\u2082(g)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'AgNO3_aq',      label: 'AgNO\u2083 (aqueous)',    cation: 'Ag', anion: 'NO3', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Ag(s)',   anodeProduct: 'O\u2082(g)',
      cathodeReaction: 'Ag\u207A + e\u207B \u2192 Ag(s)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'CuSO4_Cu',      label: 'CuSO\u2084 (aq, Cu electrodes)', cation: 'Cu', anion: 'SO4', state: 'aqueous', concentration: 'moderate', electrode: 'Cu',
      cathodeProduct: 'Cu(s) deposits', anodeProduct: 'Cu(s) dissolves',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   'Cu(s) \u2192 Cu\u00B2\u207A + 2e\u207B' }
  ];

  // ── Discharge Rule Engine (teacher mode) ─────

  var _anionData = {
    'F':   { E: +2.87, product: 'F\u2082(g)',  reaction: '2F\u207B \u2192 F\u2082(g) + 2e\u207B' },
    'Cl':  { E: +1.36, product: 'Cl\u2082(g)', reaction: '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    'Br':  { E: +1.07, product: 'Br\u2082(l)', reaction: '2Br\u207B \u2192 Br\u2082(l) + 2e\u207B' },
    'I':   { E: +0.54, product: 'I\u2082(s)',  reaction: '2I\u207B \u2192 I\u2082(s) + 2e\u207B' },
    'OH':  { E: +0.40, product: 'O\u2082(g)',  reaction: '4OH\u207B \u2192 O\u2082(g) + 2H\u2082O + 4e\u207B' },
    'SO4': { E: +2.01, product: 'O\u2082(g)',  reaction: '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    'NO3': { E: +2.01, product: 'O\u2082(g)',  reaction: '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' }
  };

  function predictElectrolysis(config) {
    var cationHC = getHalfCell(config.cation);
    var anionInfo = _anionData[config.anion];
    if (!cationHC || !anionInfo) return null;

    var cathodeProduct, cathodeReaction, cathodeExplanation;
    var anodeProduct, anodeReaction, anodeExplanation;

    if (config.state === 'molten') {
      cathodeProduct = cationHC.metal;
      cathodeReaction = cationHC.halfReaction;
      cathodeExplanation = 'Molten: only ' + cationHC.ion + ' ions available for reduction.';
      anodeProduct = anionInfo.product;
      anodeReaction = anionInfo.reaction;
      anodeExplanation = 'Molten: only ' + config.anion + '\u207B ions available for oxidation.';
    } else {
      // Aqueous cathode
      if (cationHC.E >= -0.41) {
        cathodeProduct = cationHC.metal + '(s)';
        cathodeReaction = cationHC.halfReaction;
        cathodeExplanation = cationHC.ion + ' has more positive E\u00B0 than H\u2082O, so it is preferentially discharged.';
      } else {
        cathodeProduct = 'H\u2082(g)';
        cathodeReaction = '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B';
        cathodeExplanation = cationHC.ion + ' is too reactive (E\u00B0 too negative). Water is reduced instead.';
      }

      // Aqueous anode — active electrode check first
      if (config.electrode && config.electrode !== 'inert') {
        var activeHC = getHalfCell(config.electrode);
        if (activeHC) {
          anodeProduct = activeHC.metal + '(s) dissolves';
          anodeReaction = activeHC.metal + '(s) \u2192 ' + activeHC.ion + '(aq) + ' + activeHC.electrons + 'e\u207B';
          anodeExplanation = 'Active ' + activeHC.metal + ' electrode dissolves in preference to anion oxidation.';
        }
      }

      if (!anodeProduct) {
        var isHalide = (config.anion === 'Cl' || config.anion === 'Br' || config.anion === 'I');
        if (isHalide && config.concentration !== 'dilute') {
          anodeProduct = anionInfo.product;
          anodeReaction = anionInfo.reaction;
          anodeExplanation = 'Halide ions (' + config.anion + '\u207B) are preferentially discharged (concentration/kinetic effect).';
        } else if (isHalide && config.concentration === 'dilute') {
          anodeProduct = 'O\u2082(g)';
          anodeReaction = '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B';
          anodeExplanation = 'Dilute solution: water is oxidized in preference to dilute ' + config.anion + '\u207B.';
        } else {
          anodeProduct = 'O\u2082(g)';
          anodeReaction = '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B';
          anodeExplanation = config.anion + ' ions are not discharged. Water is oxidized instead.';
        }
      }
    }

    return {
      cathodeProduct:     cathodeProduct,
      anodeProduct:       anodeProduct,
      cathodeReaction:    cathodeReaction,
      anodeReaction:      anodeReaction,
      cathodeExplanation: cathodeExplanation,
      anodeExplanation:   anodeExplanation
    };
  }

  // ── Faraday's Law (HL) ──────────────────────

  function faraday(current, timeSeconds, electrons, molarMass) {
    var charge = current * timeSeconds;
    var molesElectrons = charge / F;
    var molesProduct = molesElectrons / electrons;
    var massProduct = molesProduct * molarMass;
    return {
      charge:         Math.round(charge * 100) / 100,
      molesElectrons: molesElectrons,
      molesProduct:   molesProduct,
      massProduct:    Math.round(massProduct * 1000) / 1000
    };
  }

  // ── ΔG° Calculation (HL) ─────────────────────

  function deltaG(eCell, electronTransfer) {
    var dG = -electronTransfer * F * eCell / 1000;
    return { deltaG: Math.round(dG * 100) / 100 };
  }

  // ── Return ───────────────────────────────────

  return {
    F:                   F,
    HALF_CELLS:          HALF_CELLS,
    ELECTROLYTES:        ELECTROLYTES,
    getHalfCell:         getHalfCell,
    calculateCell:       calculateCell,
    getActivitySeries:   getActivitySeries,
    predictElectrolysis: predictElectrolysis,
    faraday:             faraday,
    deltaG:              deltaG
  };

})();

// Register Electrochem fallback data
SimEngine.Data.registerFallback('electrochem_half_cells', SimEngine.Electrochem.HALF_CELLS);
SimEngine.Data.registerFallback('electrochem_electrolytes', SimEngine.Electrochem.ELECTROLYTES);

// ═══════════════════════════════════════════════════════════════════════════
//  SimEngine.VSEPR — VSEPR & Molecular Geometry Explorer
// ═══════════════════════════════════════════════════════════════════════════

SimEngine.VSEPR = (function() {
  'use strict';

  // ── Electronegativity lookup (Pauling scale) ────────────────────────────

  var EN = {
    H: 2.20, He: 0, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44,
    F: 3.98, Ne: 0, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58,
    Cl: 3.16, Ar: 0, Br: 2.96, I: 2.66, Se: 2.55, Xe: 2.60, Kr: 3.00,
    Sn: 1.96, Pb: 2.33, As: 2.18, Te: 2.10, Sb: 2.05
  };

  // ── CPK color lookup ────────────────────────────────────────────────────

  var CPK = {
    H: '#E8E8E8', C: '#374151', N: '#3B82F6', O: '#EF4444', F: '#22C55E',
    Cl: '#10B981', Br: '#92400E', I: '#7C3AED', S: '#EAB308', P: '#F97316',
    B: '#F59E0B', Be: '#84CC16', Xe: '#06B6D4', Se: '#D97706', Si: '#9CA3AF',
    Na: '#A855F7', K: '#8B5CF6', Ca: '#22D3EE', Al: '#CBD5E1', Mg: '#84CC16',
    Sn: '#6B7280', Pb: '#475569', default: '#94A3B8'
  };

  // ── Domain position generators ──────────────────────────────────────────

  function linearPositions() {
    return [[0, 0, 1], [0, 0, -1]];
  }

  function trigonalPlanarPositions() {
    return [
      [0, 0, 1],
      [-0.8660, 0, -0.5],
      [0.8660, 0, -0.5]
    ];
  }

  function tetrahedralPositions() {
    return [
      [0, 0, 1],
      [0, 0.9428, -0.3333],
      [-0.8165, -0.4714, -0.3333],
      [0.8165, -0.4714, -0.3333]
    ];
  }

  function trigonalBipyramidalPositions() {
    // 3 equatorial (xz plane, indices 0-2) + 2 axial (y axis, indices 3-4)
    return [
      [0, 0, 1],           // equatorial 1
      [-0.8660, 0, -0.5],  // equatorial 2
      [0.8660, 0, -0.5],   // equatorial 3
      [0, 1, 0],           // axial top
      [0, -1, 0]           // axial bottom
    ];
  }

  function octahedralPositions() {
    return [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];
  }

  // ── GEOMETRIES object ──────────────────────────────────────────────────
  // Keyed by "electronDomains-lonePairs" (e.g., "5-1" = 5 domains, 1 lone pair)
  // Lone pair placement:
  //   - Trigonal bipyramidal: lone pairs occupy equatorial positions first
  //   - Octahedral: lone pairs occupy trans (opposite) positions

  var GEOMETRIES = {
    '2-0': {
      electronDomains: 2,
      electronGeometry: 'linear',
      molecularGeometry: 'linear',
      idealAngle: '180\u00B0',
      hybridization: 'sp',
      domainPositions: linearPositions
    },
    '3-0': {
      electronDomains: 3,
      electronGeometry: 'trigonal planar',
      molecularGeometry: 'trigonal planar',
      idealAngle: '120\u00B0',
      hybridization: 'sp\u00B2',
      domainPositions: trigonalPlanarPositions
    },
    '3-1': {
      electronDomains: 3,
      electronGeometry: 'trigonal planar',
      molecularGeometry: 'bent',
      idealAngle: '~117\u00B0',
      hybridization: 'sp\u00B2',
      domainPositions: trigonalPlanarPositions
    },
    '4-0': {
      electronDomains: 4,
      electronGeometry: 'tetrahedral',
      molecularGeometry: 'tetrahedral',
      idealAngle: '109.5\u00B0',
      hybridization: 'sp\u00B3',
      domainPositions: tetrahedralPositions
    },
    '4-1': {
      electronDomains: 4,
      electronGeometry: 'tetrahedral',
      molecularGeometry: 'trigonal pyramidal',
      idealAngle: '~107\u00B0',
      hybridization: 'sp\u00B3',
      domainPositions: tetrahedralPositions
    },
    '4-2': {
      electronDomains: 4,
      electronGeometry: 'tetrahedral',
      molecularGeometry: 'bent',
      idealAngle: '~104.5\u00B0',
      hybridization: 'sp\u00B3',
      domainPositions: tetrahedralPositions
    },
    '5-0': {
      electronDomains: 5,
      electronGeometry: 'trigonal bipyramidal',
      molecularGeometry: 'trigonal bipyramidal',
      idealAngle: '90\u00B0, 120\u00B0',
      hybridization: 'sp\u00B3d',
      domainPositions: trigonalBipyramidalPositions
    },
    '5-1': {
      electronDomains: 5,
      electronGeometry: 'trigonal bipyramidal',
      molecularGeometry: 'seesaw',
      idealAngle: '~90\u00B0, 120\u00B0',
      hybridization: 'sp\u00B3d',
      domainPositions: trigonalBipyramidalPositions
    },
    '5-2': {
      electronDomains: 5,
      electronGeometry: 'trigonal bipyramidal',
      molecularGeometry: 'T-shaped',
      idealAngle: '~90\u00B0',
      hybridization: 'sp\u00B3d',
      domainPositions: trigonalBipyramidalPositions
    },
    '5-3': {
      electronDomains: 5,
      electronGeometry: 'trigonal bipyramidal',
      molecularGeometry: 'linear',
      idealAngle: '180\u00B0',
      hybridization: 'sp\u00B3d',
      domainPositions: trigonalBipyramidalPositions
    },
    '6-0': {
      electronDomains: 6,
      electronGeometry: 'octahedral',
      molecularGeometry: 'octahedral',
      idealAngle: '90\u00B0',
      hybridization: 'sp\u00B3d\u00B2',
      domainPositions: octahedralPositions
    },
    '6-1': {
      electronDomains: 6,
      electronGeometry: 'octahedral',
      molecularGeometry: 'square pyramidal',
      idealAngle: '~90\u00B0',
      hybridization: 'sp\u00B3d\u00B2',
      domainPositions: octahedralPositions
    },
    '6-2': {
      electronDomains: 6,
      electronGeometry: 'octahedral',
      molecularGeometry: 'square planar',
      idealAngle: '90\u00B0',
      hybridization: 'sp\u00B3d\u00B2',
      domainPositions: octahedralPositions
    }
  };

  // ── MOLECULES array (~30 presets) ───────────────────────────────────────

  var MOLECULES = [
    // Linear (2-0)
    { key: 'BeCl2', name: 'Beryllium chloride', formula: 'BeCl\u2082', central: 'Be', terminals: ['Cl', 'Cl'], bondingPairs: 2, lonePairs: 0, bondOrders: [1, 1], expandedOctet: false },
    { key: 'CO2', name: 'Carbon dioxide', formula: 'CO\u2082', central: 'C', terminals: ['O', 'O'], bondingPairs: 2, lonePairs: 0, bondOrders: [2, 2], expandedOctet: false },
    { key: 'HCN', name: 'Hydrogen cyanide', formula: 'HCN', central: 'C', terminals: ['H', 'N'], bondingPairs: 2, lonePairs: 0, bondOrders: [1, 3], expandedOctet: false },

    // Trigonal planar (3-0)
    { key: 'BF3', name: 'Boron trifluoride', formula: 'BF\u2083', central: 'B', terminals: ['F', 'F', 'F'], bondingPairs: 3, lonePairs: 0, bondOrders: [1, 1, 1], expandedOctet: false },
    { key: 'SO3', name: 'Sulfur trioxide', formula: 'SO\u2083', central: 'S', terminals: ['O', 'O', 'O'], bondingPairs: 3, lonePairs: 0, bondOrders: [2, 2, 2], expandedOctet: false },
    { key: 'NO3', name: 'Nitrate ion', formula: 'NO\u2083\u207B', central: 'N', terminals: ['O', 'O', 'O'], bondingPairs: 3, lonePairs: 0, bondOrders: [1.33, 1.33, 1.33], expandedOctet: false },

    // Bent from trigonal planar (2-1)
    { key: 'SO2', name: 'Sulfur dioxide', formula: 'SO\u2082', central: 'S', terminals: ['O', 'O'], bondingPairs: 2, lonePairs: 1, bondOrders: [2, 2], expandedOctet: false },
    { key: 'O3', name: 'Ozone', formula: 'O\u2083', central: 'O', terminals: ['O', 'O'], bondingPairs: 2, lonePairs: 1, bondOrders: [1.5, 1.5], expandedOctet: false },

    // Tetrahedral (4-0)
    { key: 'CH4', name: 'Methane', formula: 'CH\u2084', central: 'C', terminals: ['H', 'H', 'H', 'H'], bondingPairs: 4, lonePairs: 0, bondOrders: [1, 1, 1, 1], expandedOctet: false },
    { key: 'NH4', name: 'Ammonium ion', formula: 'NH\u2084\u207A', central: 'N', terminals: ['H', 'H', 'H', 'H'], bondingPairs: 4, lonePairs: 0, bondOrders: [1, 1, 1, 1], expandedOctet: false },
    { key: 'CCl4', name: 'Carbon tetrachloride', formula: 'CCl\u2084', central: 'C', terminals: ['Cl', 'Cl', 'Cl', 'Cl'], bondingPairs: 4, lonePairs: 0, bondOrders: [1, 1, 1, 1], expandedOctet: false },
    { key: 'CF4', name: 'Carbon tetrafluoride', formula: 'CF\u2084', central: 'C', terminals: ['F', 'F', 'F', 'F'], bondingPairs: 4, lonePairs: 0, bondOrders: [1, 1, 1, 1], expandedOctet: false },

    // Trigonal pyramidal (3-1)
    { key: 'NH3', name: 'Ammonia', formula: 'NH\u2083', central: 'N', terminals: ['H', 'H', 'H'], bondingPairs: 3, lonePairs: 1, bondOrders: [1, 1, 1], expandedOctet: false },
    { key: 'PCl3', name: 'Phosphorus trichloride', formula: 'PCl\u2083', central: 'P', terminals: ['Cl', 'Cl', 'Cl'], bondingPairs: 3, lonePairs: 1, bondOrders: [1, 1, 1], expandedOctet: false },
    { key: 'H3O', name: 'Hydronium ion', formula: 'H\u2083O\u207A', central: 'O', terminals: ['H', 'H', 'H'], bondingPairs: 3, lonePairs: 1, bondOrders: [1, 1, 1], expandedOctet: false },
    { key: 'NF3', name: 'Nitrogen trifluoride', formula: 'NF\u2083', central: 'N', terminals: ['F', 'F', 'F'], bondingPairs: 3, lonePairs: 1, bondOrders: [1, 1, 1], expandedOctet: false },

    // Bent from tetrahedral (2-2)
    { key: 'H2O', name: 'Water', formula: 'H\u2082O', central: 'O', terminals: ['H', 'H'], bondingPairs: 2, lonePairs: 2, bondOrders: [1, 1], expandedOctet: false },
    { key: 'H2S', name: 'Hydrogen sulfide', formula: 'H\u2082S', central: 'S', terminals: ['H', 'H'], bondingPairs: 2, lonePairs: 2, bondOrders: [1, 1], expandedOctet: false },
    { key: 'SCl2', name: 'Sulfur dichloride', formula: 'SCl\u2082', central: 'S', terminals: ['Cl', 'Cl'], bondingPairs: 2, lonePairs: 2, bondOrders: [1, 1], expandedOctet: false },

    // Trigonal bipyramidal (5-0)
    { key: 'PCl5', name: 'Phosphorus pentachloride', formula: 'PCl\u2085', central: 'P', terminals: ['Cl', 'Cl', 'Cl', 'Cl', 'Cl'], bondingPairs: 5, lonePairs: 0, bondOrders: [1, 1, 1, 1, 1], expandedOctet: true },

    // Seesaw (4-1)
    { key: 'SF4', name: 'Sulfur tetrafluoride', formula: 'SF\u2084', central: 'S', terminals: ['F', 'F', 'F', 'F'], bondingPairs: 4, lonePairs: 1, bondOrders: [1, 1, 1, 1], expandedOctet: true },

    // T-shaped (3-2)
    { key: 'ClF3', name: 'Chlorine trifluoride', formula: 'ClF\u2083', central: 'Cl', terminals: ['F', 'F', 'F'], bondingPairs: 3, lonePairs: 2, bondOrders: [1, 1, 1], expandedOctet: true },
    { key: 'BrF3', name: 'Bromine trifluoride', formula: 'BrF\u2083', central: 'Br', terminals: ['F', 'F', 'F'], bondingPairs: 3, lonePairs: 2, bondOrders: [1, 1, 1], expandedOctet: true },

    // Linear from trig bipyramidal (2-3)
    { key: 'XeF2', name: 'Xenon difluoride', formula: 'XeF\u2082', central: 'Xe', terminals: ['F', 'F'], bondingPairs: 2, lonePairs: 3, bondOrders: [1, 1], expandedOctet: true },
    { key: 'I3', name: 'Triiodide ion', formula: 'I\u2083\u207B', central: 'I', terminals: ['I', 'I'], bondingPairs: 2, lonePairs: 3, bondOrders: [1, 1], expandedOctet: true },

    // Octahedral (6-0)
    { key: 'SF6', name: 'Sulfur hexafluoride', formula: 'SF\u2086', central: 'S', terminals: ['F', 'F', 'F', 'F', 'F', 'F'], bondingPairs: 6, lonePairs: 0, bondOrders: [1, 1, 1, 1, 1, 1], expandedOctet: true },

    // Square pyramidal (5-1)
    { key: 'BrF5', name: 'Bromine pentafluoride', formula: 'BrF\u2085', central: 'Br', terminals: ['F', 'F', 'F', 'F', 'F'], bondingPairs: 5, lonePairs: 1, bondOrders: [1, 1, 1, 1, 1], expandedOctet: true },
    { key: 'IF5', name: 'Iodine pentafluoride', formula: 'IF\u2085', central: 'I', terminals: ['F', 'F', 'F', 'F', 'F'], bondingPairs: 5, lonePairs: 1, bondOrders: [1, 1, 1, 1, 1], expandedOctet: true },

    // Square planar (4-2)
    { key: 'XeF4', name: 'Xenon tetrafluoride', formula: 'XeF\u2084', central: 'Xe', terminals: ['F', 'F', 'F', 'F'], bondingPairs: 4, lonePairs: 2, bondOrders: [1, 1, 1, 1], expandedOctet: true }
  ];

  // ── Molecule lookup map ─────────────────────────────────────────────────

  var _moleculeMap = {};
  for (var i = 0; i < MOLECULES.length; i++) _moleculeMap[MOLECULES[i].key] = MOLECULES[i];

  function getMolecule(key) {
    return _moleculeMap[key] || null;
  }

  // ── getGeometry(bondingPairs, lonePairs) ────────────────────────────────
  // Returns atom and lone pair coordinates from domain positions.
  // Lone pairs are assigned based on VSEPR rules:
  //   - Trigonal bipyramidal: lone pairs occupy equatorial positions first
  //   - Octahedral: lone pairs occupy trans (opposite) positions

  function getGeometry(bondingPairs, lonePairs) {
    var key = (bondingPairs + lonePairs) + '-' + lonePairs;
    var geom = GEOMETRIES[key];
    if (!geom) return null;

    var positions = geom.domainPositions();
    var totalDomains = bondingPairs + lonePairs;
    var atoms = [];
    var lpPositions = [];

    // Determine which domain indices are lone pairs vs bonding.
    var lpIndices = [];

    if (geom.electronGeometry === 'trigonal bipyramidal' && lonePairs > 0) {
      // Equatorial positions are indices 0, 1, 2; axial are 3, 4
      // Lone pairs occupy equatorial positions first
      for (var lp = 0; lp < lonePairs && lp < 3; lp++) {
        lpIndices.push(lp);
      }
    } else if (geom.electronGeometry === 'octahedral' && lonePairs > 0) {
      // Positions: [+x, -x, +y, -y, +z, -z] (indices 0-5)
      // First lone pair at index 0 (+x), second at index 1 (-x) — trans to first
      if (lonePairs >= 1) lpIndices.push(0);
      if (lonePairs >= 2) lpIndices.push(1);
    } else {
      // For other geometries, lone pairs occupy the last positions
      for (var lp2 = 0; lp2 < lonePairs; lp2++) {
        lpIndices.push(totalDomains - 1 - lp2);
      }
    }

    var atomIndex = 0;
    for (var d = 0; d < positions.length; d++) {
      if (d >= totalDomains) break;
      var pos = positions[d];
      var isLP = false;
      for (var li = 0; li < lpIndices.length; li++) {
        if (lpIndices[li] === d) { isLP = true; break; }
      }
      if (isLP) {
        lpPositions.push({ x: pos[0], y: pos[1], z: pos[2] });
      } else {
        atoms.push({ x: pos[0], y: pos[1], z: pos[2], index: atomIndex });
        atomIndex++;
      }
    }

    return {
      electronDomains: geom.electronDomains,
      electronGeometry: geom.electronGeometry,
      molecularGeometry: geom.molecularGeometry,
      idealAngle: geom.idealAngle,
      hybridization: geom.hybridization,
      atoms: atoms,
      lonePairs: lpPositions
    };
  }

  // ── getPolarity(central, terminals) ─────────────────────────────────────
  // terminals is array of { element, x, y, z }

  function getPolarity(central, terminals) {
    var enCentral = EN[central] || 0;
    var netX = 0, netY = 0, netZ = 0;
    var bondDipoles = [];

    for (var i = 0; i < terminals.length; i++) {
      var t = terminals[i];
      var enTerminal = EN[t.element] || 0;
      var diff = enTerminal - enCentral;

      // Unit vector from central to terminal
      var mag = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z);
      var ux = mag > 0 ? t.x / mag : 0;
      var uy = mag > 0 ? t.y / mag : 0;
      var uz = mag > 0 ? t.z / mag : 0;

      // Dipole points toward more electronegative atom
      var dx = diff * ux;
      var dy = diff * uy;
      var dz = diff * uz;

      bondDipoles.push({ element: t.element, diff: diff, dx: dx, dy: dy, dz: dz });
      netX += dx;
      netY += dy;
      netZ += dz;
    }

    var netMag = Math.sqrt(netX * netX + netY * netY + netZ * netZ);
    var isPolar = netMag > 0.1;

    var explanation;
    if (!isPolar) {
      var allSame = true;
      for (var j = 1; j < terminals.length; j++) {
        if (terminals[j].element !== terminals[0].element) { allSame = false; break; }
      }
      if (allSame && terminals.length > 1) {
        explanation = 'Bond dipoles cancel due to symmetric geometry.';
      } else {
        explanation = 'Net dipole moment is approximately zero; molecule is nonpolar.';
      }
    } else {
      explanation = 'Asymmetric charge distribution produces a net dipole moment (' +
        netMag.toFixed(2) + ' relative units). The molecule is polar.';
    }

    return {
      bondDipoles: bondDipoles,
      netDipole: { x: netX, y: netY, z: netZ, magnitude: netMag },
      isPolar: isPolar,
      explanation: explanation
    };
  }

  // ── getHybridization(electronDomains) ───────────────────────────────────

  function getHybridization(electronDomains) {
    var map = {
      2: { hybridization: 'sp',       description: 'Two electron domains: one s and one p orbital combine to form two sp hybrid orbitals oriented 180\u00B0 apart.' },
      3: { hybridization: 'sp\u00B2', description: 'Three electron domains: one s and two p orbitals combine to form three sp\u00B2 hybrid orbitals in a trigonal planar arrangement at 120\u00B0.' },
      4: { hybridization: 'sp\u00B3', description: 'Four electron domains: one s and three p orbitals combine to form four sp\u00B3 hybrid orbitals in a tetrahedral arrangement at 109.5\u00B0.' },
      5: { hybridization: 'sp\u00B3d', description: 'Five electron domains: one s, three p, and one d orbital combine to form five sp\u00B3d hybrid orbitals in a trigonal bipyramidal arrangement.' },
      6: { hybridization: 'sp\u00B3d\u00B2', description: 'Six electron domains: one s, three p, and two d orbitals combine to form six sp\u00B3d\u00B2 hybrid orbitals in an octahedral arrangement at 90\u00B0.' }
    };
    return map[electronDomains] || { hybridization: 'unknown', description: 'Hybridization not defined for ' + electronDomains + ' electron domains.' };
  }

  // ── getSigmaPi(bondOrders) ──────────────────────────────────────────────

  function getSigmaPi(bondOrders) {
    var sigmaBonds = bondOrders.length;
    var piBonds = 0;
    for (var i = 0; i < bondOrders.length; i++) {
      var rounded = Math.round(bondOrders[i]);
      var pi = rounded - 1;
      if (pi > 0) piBonds += pi;
    }
    return { sigmaBonds: sigmaBonds, piBonds: piBonds };
  }

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    MOLECULES: MOLECULES,
    EN: EN,
    CPK: CPK,
    getGeometry: getGeometry,
    getPolarity: getPolarity,
    getHybridization: getHybridization,
    getSigmaPi: getSigmaPi,
    getMolecule: getMolecule
  };

})();

// Register VSEPR fallback data
SimEngine.Data.registerFallback('vsepr_molecules', SimEngine.VSEPR.MOLECULES);
SimEngine.Data.registerFallback('vsepr_en', SimEngine.VSEPR.EN);
SimEngine.Data.registerFallback('vsepr_cpk', SimEngine.VSEPR.CPK);
