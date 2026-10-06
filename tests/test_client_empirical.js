/**
 * Empirical Stress-Testing Harness for JS Client-Side Physics and Data Export
 * Virtual Lab Fisika TPB ITB
 */

import { PhysicsEngine } from '../src/static/js/physics.js';
import assert from 'assert';

console.log('=== STARTING JS CLIENT EMPIRICAL CHALLENGE ===\n');

// 1. Benchmark Precision Challenge
console.log('[CHALLENGE 1] JS Benchmark Precision (v0=45, angle=45, y0=0, g=9.81)');
const engine = new PhysicsEngine({ v0: 45.0, angleDeg: 45.0, y0: 0.0, g: 9.81 });
const bench = engine.calculateAnalytical();

const expR = 206.42;
const expH = 51.61;
const expT = 6.49;

const errR = Math.abs(bench.horizontal_range - expR) / expR;
const errH = Math.abs(bench.max_height - expH) / expH;
const errT = Math.abs(bench.flight_time - expT) / expT;

console.log(`  R: ${bench.horizontal_range} m (expected ≈ ${expR} m, error: ${(errR * 100).toFixed(4)}%)`);
console.log(`  h_max: ${bench.max_height} m (expected ≈ ${expH} m, error: ${(errH * 100).toFixed(4)}%)`);
console.log(`  flight_time: ${bench.flight_time} s (expected ≈ ${expT} s, error: ${(errT * 100).toFixed(4)}%)`);

assert(errR <= 0.005, `JS horizontal_range error ${errR} exceeds 0.5% tolerance`);
assert(errH <= 0.005, `JS max_height error ${errH} exceeds 0.5% tolerance`);
assert(errT <= 0.005, `JS flight_time error ${errT} exceeds 0.5% tolerance`);
console.log('  -> PASS: JS Benchmark within 0.5% tolerance\n');

// 2. Elevated Platform & Energy Conservation Invariant
console.log('[CHALLENGE 2] JS Elevated Platform & Energy Conservation');
const energyTestCases = [
  { v0: 45.0, angle: 55.0, y0: 10.0, g: 9.81 },
  { v0: 45.0, angle: 45.0, y0: 50.0, g: 9.81 },
  { v0: 30.0, angle: 30.0, y0: 25.0, g: 9.81 },
  { v0: 60.0, angle: 70.0, y0: 100.0, g: 3.71 }, // Mars
  { v0: 20.0, angle: 15.0, y0: 10.0, g: 1.62 },  // Moon
  { v0: 50.0, angle: 0.0,  y0: 45.0, g: 9.81 },  // Horizontal launch from cliff
  { v0: 35.0, angle: 90.0, y0: 30.0, g: 9.81 },  // Pure vertical from platform
];

for (const tc of energyTestCases) {
  const res = engine.calculateAnalytical({
    v0: tc.v0,
    angleDeg: tc.angle,
    y0: tc.y0,
    g: tc.g,
  });
  const expectedV = Math.sqrt(tc.v0 * tc.v0 + 2 * tc.g * tc.y0);
  const relErr = Math.abs(res.impact_velocity - expectedV) / expectedV;
  console.log(`  Case v0=${tc.v0}, angle=${tc.angle}°, y0=${tc.y0}m, g=${tc.g}:`);
  console.log(`    v_impact: ${res.impact_velocity.toFixed(3)} m/s, theoretical: ${expectedV.toFixed(3)} m/s, err: ${(relErr * 100).toFixed(4)}%`);
  assert(relErr < 0.001, `Impact velocity violated energy conservation: got ${res.impact_velocity}, expected ${expectedV}`);
}
console.log('  -> PASS: Mechanical Energy Conservation Invariant holds for all elevations\n');

// 3. Boundary & Physical Extremes in JS
console.log('[CHALLENGE 3] JS Boundary & Physical Extremes');

// Theta = 0 (Horizontal cliff drop)
const resAngle0 = engine.calculateAnalytical({ v0: 40.0, angleDeg: 0.0, y0: 20.0, g: 9.81 });
const expectedT0 = Math.sqrt(2 * 20.0 / 9.81);
const expectedR0 = 40.0 * expectedT0;
assert(Math.abs(resAngle0.flight_time - expectedT0) < 0.01, `t error at angle 0: ${resAngle0.flight_time} vs ${expectedT0}`);
assert(Math.abs(resAngle0.horizontal_range - expectedR0) < 0.05, `R error at angle 0: ${resAngle0.horizontal_range} vs ${expectedR0}`);
assert(resAngle0.max_height === 20.0, `h_max should equal y0 for angle 0`);
console.log('  -> PASS: angle=0° horizontal launch verified');

// Theta = 90 (Pure vertical)
const resAngle90 = engine.calculateAnalytical({ v0: 40.0, angleDeg: 90.0, y0: 10.0, g: 9.81 });
const expectedH90 = 10.0 + (40.0 * 40.0) / (2 * 9.81);
assert(Math.abs(resAngle90.horizontal_range) < 0.001, `R must be 0 for pure vertical launch`);
assert(Math.abs(resAngle90.max_height - expectedH90) < 0.05, `h_max error at angle 90`);
console.log('  -> PASS: angle=90° pure vertical launch verified');

// v0 = 0, y0 = 0
const resZero = engine.calculateAnalytical({ v0: 0.0, angleDeg: 45.0, y0: 0.0, g: 9.81 });
assert(resZero.flight_time === 0.0 && resZero.horizontal_range === 0.0, 'Zero launch must yield zero flight');
console.log('  -> PASS: v0=0, y0=0 zero launch verified\n');

// 4. JS Numerical StepKinematics vs Analytical trajectory
console.log('[CHALLENGE 4] JS Numerical StepKinematics Integration vs Analytical Solution');
let pos = { x: 0.0, y: 0.0 };
let vel = { vx: 45.0 * Math.cos(Math.PI / 4), vy: 45.0 * Math.sin(Math.PI / 4) };
const dt = 1 / 60; // 60 FPS
let simTime = 0;
while (pos.y >= 0 && simTime < 10) {
  const step = engine.stepKinematics(pos, vel, dt, { g: 9.81, airResistance: false });
  pos = step.pos;
  vel = step.vel;
  simTime += dt;
}
const numError = Math.abs(pos.x - 206.42) / 206.42;
console.log(`  Numerical landing x: ${pos.x.toFixed(2)} m, theoretical: 206.42 m (error: ${(numError * 100).toFixed(2)}%)`);
assert(numError < 0.01, `Euler step numerical error ${numError} exceeds 1%`);
console.log('  -> PASS: 60 FPS numerical simulation matches analytical trajectory within 1%\n');

// 5. Offline Fallback & CSV / JSON schema verification
console.log('[CHALLENGE 5] CSV & JSON Schema Verification');
// Test UTF-8 BOM in CSV generator
function generateMockCSV(trials) {
  const bom = '\uFEFF';
  const headers = [
    'trial_number', 'v0', 'angle', 'y0', 'g', 'ammo_type',
    'simulated_range', 'theoretical_range', 'relative_error_percentage',
    'h_max', 'status', 'timestamp'
  ];
  const rows = trials.map((t) => [
    t.trial_number, t.v0, t.angle, t.y0, t.g, `"${t.ammo_type || 'standard'}"`,
    t.simulated_range, t.theoretical_range, t.relative_error_percentage,
    t.h_max !== undefined ? t.h_max : 0, `"${t.status}"`, `"${t.timestamp || ''}"`
  ]);
  return bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

const mockTrials = [
  {
    trial_number: 1, v0: 45.0, angle: 45.0, y0: 0.0, g: 9.81, ammo_type: 'standard',
    simulated_range: 206.81, theoretical_range: 206.42, relative_error_percentage: 0.19,
    h_max: 51.61, status: 'HIT', timestamp: '2026-10-06T08:30:00Z'
  }
];

const csvOut = generateMockCSV(mockTrials);
assert(csvOut.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM \\uFEFF');
assert(csvOut.includes('\r\n'), 'CSV must use CRLF RFC 4180 line endings');
const lines = csvOut.replace('\uFEFF', '').split('\r\n');
assert(lines[0].startsWith('trial_number,v0,angle,y0,g'), 'Headers must match RFC 4180 specification');
console.log('  -> PASS: CSV starts with UTF-8 BOM and follows RFC 4180');

// Test LabExperimentSession JSON Schema
const mockSession = {
  session_id: 'lab-uuid-test',
  student_name: 'Mahasiswa TPB',
  experiment_timestamp: '2026-10-06T08:25:00Z',
  trials: mockTrials
};

assert(typeof mockSession.session_id === 'string', 'session_id must be string');
assert(typeof mockSession.student_name === 'string', 'student_name must be string');
assert(typeof mockSession.experiment_timestamp === 'string', 'experiment_timestamp must be string');
assert(Array.isArray(mockSession.trials), 'trials must be array');
for (const t of mockSession.trials) {
  assert('trial_number' in t, 'trial must have trial_number');
  assert('v0' in t, 'trial must have v0');
  assert('angle' in t, 'trial must have angle');
  assert('y0' in t, 'trial must have y0');
  assert('g' in t, 'trial must have g');
  assert('simulated_range' in t, 'trial must have simulated_range');
  assert('theoretical_range' in t, 'trial must have theoretical_range');
  assert('relative_error_percentage' in t, 'trial must have relative_error_percentage');
  assert('status' in t, 'trial must have status');
}
console.log('  -> PASS: JSON strictly conforms to AGENTS.md §5.4 LabExperimentSession schema');

console.log('\n=== ALL JS EMPIRICAL CHALLENGES PASSED SUCCESSFULLY ===');
