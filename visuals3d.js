// Sentinel Visualizations Engine (Three.js WebGL & 2D Vector Canvas Maps)

// ==========================================================
// 1. Landing Page: 3D Earth Globe
// ==========================================================
let landingGlobeScene, landingGlobeCamera, landingGlobeRenderer;
let globeMesh, globeClouds, globeAtmosphere;
let starsParticleSystem;
let pulseWaves = [];

function initLandingGlobe() {
  const container = document.getElementById("landing-globe-canvas-container");
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene & Camera
  landingGlobeScene = new THREE.Scene();
  landingGlobeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  landingGlobeCamera.position.z = 220;

  // Renderer
  landingGlobeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  landingGlobeRenderer.setSize(width, height);
  landingGlobeRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(landingGlobeRenderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
  landingGlobeScene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 1.2);
  dirLight1.position.set(100, 100, 50);
  landingGlobeScene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xef4444, 0.6);
  dirLight2.position.set(-100, -50, -50);
  landingGlobeScene.add(dirLight2);

  // Globe Sphere Mesh
  const radius = 60;
  const geometry = new THREE.SphereGeometry(radius, 40, 40);
  
  // Custom futuristic grid texture generated on canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0c1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw continents map grid lines (mock world grid)
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let j = 0; j < canvas.height; j += 16) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(canvas.width, j);
    ctx.stroke();
  }

  // Draw some procedural continent outlines
  ctx.fillStyle = "#3b82f6";
  ctx.globalAlpha = 0.35;
  // Asia / Europe
  ctx.beginPath();
  ctx.arc(650, 180, 140, 0, Math.PI * 2);
  ctx.fill();
  // Africa
  ctx.beginPath();
  ctx.arc(500, 280, 90, 0, Math.PI * 2);
  ctx.fill();
  // Americas
  ctx.beginPath();
  ctx.arc(220, 240, 110, 0, Math.PI * 2);
  ctx.fill();
  // Australia
  ctx.beginPath();
  ctx.arc(800, 360, 60, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    shininess: 25,
    bumpScale: 1.5,
    specular: new THREE.Color(0x1d4ed8)
  });
  
  globeMesh = new THREE.Mesh(geometry, material);
  landingGlobeScene.add(globeMesh);

  // Wireframe outer sphere
  const wireframeGeom = new THREE.SphereGeometry(radius + 1.5, 30, 30);
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    wireframe: true,
    transparent: true,
    opacity: 0.08
  });
  const wireframeGlobe = new THREE.Mesh(wireframeGeom, wireframeMat);
  globeMesh.add(wireframeGlobe);

  // Stars background particles
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 300;
  const positions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount * 3; i += 3) {
    const radiusDist = 180 + Math.random() * 150;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    positions[i] = radiusDist * Math.sin(phi) * Math.cos(theta);
    positions[i+1] = radiusDist * Math.sin(phi) * Math.sin(theta);
    positions[i+2] = radiusDist * Math.cos(phi);
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    transparent: true,
    opacity: 0.6
  });
  starsParticleSystem = new THREE.Points(starsGeometry, starsMaterial);
  landingGlobeScene.add(starsParticleSystem);

  // Concentric Emergency pulse waves at Puducherry coordinates (centered roughly in visual front)
  addDisasterPulse(12, 80); // Puducherry mock placement

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Auto Rotation
    globeMesh.rotation.y += 0.0025;
    globeMesh.rotation.x += 0.0005;
    starsParticleSystem.rotation.y -= 0.0003;

    // Pulse Wave animations
    pulseWaves.forEach((w, idx) => {
      w.scale.addScalar(0.015);
      w.material.opacity -= 0.008;
      if (w.material.opacity <= 0) {
        w.scale.set(1, 1, 1);
        w.material.opacity = 0.8;
      }
    });

    landingGlobeRenderer.render(landingGlobeScene, landingGlobeCamera);
  }

  animate();

  // Resize handler
  window.addEventListener("resize", () => {
    if (!container || !landingGlobeCamera || !landingGlobeRenderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    landingGlobeCamera.aspect = w / h;
    landingGlobeCamera.updateProjectionMatrix();
    landingGlobeRenderer.setSize(w, h);
  });
}

function addDisasterPulse(lat, lng) {
  // Convert lat/lng to 3D Sphere points
  const rad = 60;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(rad * Math.sin(phi) * Math.sin(theta));
  const y = rad * Math.cos(phi);
  const z = rad * Math.sin(phi) * Math.cos(theta);

  // Pulse rings
  for (let i = 0; i < 3; i++) {
    const ringGeom = new THREE.RingGeometry(0.5, 3.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8 - (i * 0.25)
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    
    // Position
    ring.position.set(x, y, z);
    
    // Point the ring outwards from globe center
    const target = new THREE.Vector3(x * 2, y * 2, z * 2);
    ring.lookAt(target);
    
    globeMesh.add(ring);
    pulseWaves.push(ring);
    
    // stagger start scale
    ring.scale.multiplyScalar(1 + i * 0.6);
  }
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  initLandingGlobe();
});

// ==========================================================
// 2. Citizen Dashboard: 3D Risk Radar (HTML5 Canvas Sweep)
// ==========================================================
let radarCanvas, radarCtx;
let radarAngle = 0;
const radarBlips = [];

function initThreeDRiskRadar() {
  const container = document.getElementById("citizen-radar-container");
  if (!container) return;

  container.innerHTML = "";
  radarCanvas = document.createElement("canvas");
  radarCanvas.width = 500;
  radarCanvas.height = 400;
  radarCanvas.style.width = "100%";
  radarCanvas.style.height = "100%";
  container.appendChild(radarCanvas);
  radarCtx = radarCanvas.getContext("2d");

  // Load target blips (mock targets based on cyclone proximity)
  radarBlips.length = 0;
  radarBlips.push({ x: 250, y: 120, size: 8, label: "Cyclone Sentinel Eye", severity: "critical", intensity: 1 });
  radarBlips.push({ x: 140, y: 280, size: 5, label: "Coastal Road Surge", severity: "high", intensity: 0.7 });
  radarBlips.push({ x: 380, y: 190, size: 6, label: "Central Depot", severity: "safe", intensity: 0.8 });

  function drawRadarSweep() {
    if (!radarCtx || container.parentElement.classList.contains("hidden")) return;
    
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) * 0.45;

    // Clear
    radarCtx.fillStyle = "rgba(6, 9, 19, 0.15)"; // leaves a trailing shadow
    radarCtx.fillRect(0, 0, w, h);

    // Background Grid circles
    radarCtx.strokeStyle = "rgba(59, 130, 246, 0.1)";
    radarCtx.lineWidth = 1;
    for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
      radarCtx.stroke();
    }

    // Cross lines
    radarCtx.beginPath();
    radarCtx.moveTo(cx - maxRadius, cy);
    radarCtx.lineTo(cx + maxRadius, cy);
    radarCtx.moveTo(cx, cy - maxRadius);
    radarCtx.lineTo(cx, cy + maxRadius);
    radarCtx.stroke();

    // Radar scan line
    radarAngle += 0.015;
    if (radarAngle > Math.PI * 2) radarAngle = 0;

    const sx = cx + Math.cos(radarAngle) * maxRadius;
    const sy = cy + Math.sin(radarAngle) * maxRadius;

    // Sweep gradient
    const gradient = radarCtx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.05)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.15)");
    
    // Draw sweep segment
    radarCtx.fillStyle = gradient;
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.arc(cx, cy, maxRadius, radarAngle - 0.25, radarAngle);
    radarCtx.closePath();
    radarCtx.fill();

    // Sweep line
    radarCtx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    radarCtx.lineWidth = 2;
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(sx, sy);
    radarCtx.stroke();

    // Draw target blips
    radarBlips.forEach(blip => {
      // Calculate angle of blip from center
      const dx = blip.x - cx;
      const dy = blip.y - cy;
      const blipAngle = Math.atan2(dy, dx);
      
      // Calculate angular distance from sweep line
      let diff = radarAngle - blipAngle;
      if (diff < 0) diff += Math.PI * 2;

      // Sweep activates intensity
      if (diff < 0.25) {
        blip.intensity = 1.0;
      } else {
        blip.intensity = Math.max(0.15, blip.intensity - 0.005);
      }

      radarCtx.beginPath();
      radarCtx.arc(blip.x, blip.y, blip.size, 0, Math.PI * 2);
      
      // Colors based on severity & intensity
      if (blip.severity === "critical") {
        radarCtx.fillStyle = `rgba(239, 68, 68, ${blip.intensity})`;
        radarCtx.strokeStyle = `rgba(239, 68, 68, ${blip.intensity * 0.4})`;
      } else if (blip.severity === "high") {
        radarCtx.fillStyle = `rgba(249, 115, 22, ${blip.intensity})`;
        radarCtx.strokeStyle = `rgba(249, 115, 22, ${blip.intensity * 0.4})`;
      } else {
        radarCtx.fillStyle = `rgba(16, 185, 129, ${blip.intensity})`;
        radarCtx.strokeStyle = `rgba(16, 185, 129, ${blip.intensity * 0.4})`;
      }
      
      radarCtx.fill();
      radarCtx.lineWidth = 3;
      radarCtx.stroke();

      // Blip outer scanning ring
      if (blip.intensity > 0.8) {
        radarCtx.beginPath();
        radarCtx.arc(blip.x, blip.y, blip.size * 2.5 * (1.8 - blip.intensity), 0, Math.PI * 2);
        radarCtx.stroke();
      }

      // Label text
      radarCtx.font = "9px monospace";
      radarCtx.fillStyle = `rgba(255, 255, 255, ${blip.intensity * 0.85})`;
      radarCtx.fillText(`${blip.label} [RISK SCORE: ${blip.severity === 'critical' ? '92%' : '44%'}]`, blip.x + 12, blip.y + 4);
    });

    window.radarAnimId = requestAnimationFrame(drawRadarSweep);
  }

  drawRadarSweep();
}

// Bind citizen view mode buttons
const btnMapView = document.getElementById("btn-map-view");
const btnRadarView = document.getElementById("btn-radar-view");
if (btnMapView && btnRadarView) {
  btnMapView.addEventListener("click", () => {
    btnMapView.classList.add("btn-active");
    btnRadarView.classList.remove("btn-active");
    document.getElementById("citizen-vector-map").classList.remove("hidden");
    document.getElementById("citizen-radar-container").classList.add("hidden");
  });

  btnRadarView.addEventListener("click", () => {
    btnRadarView.classList.add("btn-active");
    btnMapView.classList.remove("btn-active");
    document.getElementById("citizen-radar-container").classList.remove("hidden");
    document.getElementById("citizen-vector-map").classList.add("hidden");
  });
}

// ==========================================================
// 3. Authority Dashboard: 3D command Flow mesh (Three.js)
// ==========================================================
let authScene, authCamera, authRenderer;
let nodeSpheres = [];
let networkLines = [];
let networkParticles = [];

function initThreeDCommandNetwork() {
  const container = document.getElementById("authority-3d-container");
  if (!container) return;

  container.innerHTML = "";
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene & Camera
  authScene = new THREE.Scene();
  authCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  authCamera.position.set(0, 110, 150);
  authCamera.lookAt(0, 0, 0);

  // Renderer
  authRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  authRenderer.setSize(width, height);
  container.appendChild(authRenderer.domElement);

  // Base Grid
  const gridHelper = new THREE.GridHelper(160, 20, 0x3b82f6, 0x1e293b);
  gridHelper.position.y = -5;
  authScene.add(gridHelper);

  // Nodes Data (HQ, Shelters, Strom epicenter)
  const nodeDefs = [
    { name: "Command HQ", pos: { x: -30, y: 5, z: 20 }, color: 0xef4444, size: 5 },
    { name: "Shelter A (North School)", pos: { x: 20, y: 5, z: -30 }, color: 0x10b981, size: 4 },
    { name: "Shelter B (Arena)", pos: { x: 30, y: 5, z: 10 }, color: 0x10b981, size: 4 },
    { name: "Cyclone Sentinel Epicenter", pos: { x: 0, y: 5, z: -10 }, color: 0xf97316, size: 6 }
  ];

  // Render Nodes
  nodeDefs.forEach(n => {
    const geom = new THREE.SphereGeometry(n.size, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: n.color, wireframe: true });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(n.pos.x, n.pos.y, n.pos.z);
    authScene.add(mesh);
    nodeSpheres.push(mesh);

    // Glowing Ring around node
    const ringGeom = new THREE.RingGeometry(n.size + 1.5, n.size + 2.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: n.color, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(n.pos.x, n.pos.y, n.pos.z);
    ring.rotation.x = Math.PI / 2;
    authScene.add(ring);
  });

  // Render Connecting flow lines (HQ to Shelter A & B)
  const pathways = [
    { start: nodeDefs[0].pos, end: nodeDefs[1].pos },
    { start: nodeDefs[0].pos, end: nodeDefs[2].pos }
  ];

  pathways.forEach(p => {
    const points = [];
    points.push(new THREE.Vector3(p.start.x, p.start.y, p.start.z));
    points.push(new THREE.Vector3(p.end.x, p.end.y, p.end.z));
    
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.4 });
    const line = new THREE.Line(geom, mat);
    authScene.add(line);
    networkLines.push(line);

    // Particle flow animation
    for (let i = 0; i < 5; i++) {
      const pGeom = new THREE.SphereGeometry(0.8, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
      const pMesh = new THREE.Mesh(pGeom, pMat);
      pMesh.position.copy(p.start);
      authScene.add(pMesh);
      
      networkParticles.push({
        mesh: pMesh,
        start: new THREE.Vector3(p.start.x, p.start.y, p.start.z),
        end: new THREE.Vector3(p.end.x, p.end.y, p.end.z),
        t: Math.random() // offset
      });
    }
  });

  // Rotation controls on Scene
  let rotAngle = 0;
  function animate() {
    window.netAnimId = requestAnimationFrame(animate);
    
    // Rotate camera around center
    rotAngle += 0.002;
    authCamera.position.x = 150 * Math.sin(rotAngle);
    authCamera.position.z = 150 * Math.cos(rotAngle);
    authCamera.lookAt(0, 0, 0);

    // Node self spin
    nodeSpheres.forEach(mesh => {
      mesh.rotation.y += 0.01;
    });

    // Particle flows along lines
    networkParticles.forEach(p => {
      p.t += 0.005;
      if (p.t > 1) p.t = 0;
      
      // Lerp positions
      p.mesh.position.lerpVectors(p.start, p.end, p.t);
      // add dynamic wavy bounce
      p.mesh.position.y = 5 + Math.sin(p.t * Math.PI * 4) * 3;
    });

    authRenderer.render(authScene, authCamera);
  }

  animate();

  // Resize handler
  window.addEventListener("resize", () => {
    if (!container || !authCamera || !authRenderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    authCamera.aspect = w / h;
    authCamera.updateProjectionMatrix();
    authRenderer.setSize(w, h);
  });
}

// Bind auth buttons
const btnAuthMapView = document.getElementById("btn-auth-map-view");
const btnAuth3DView = document.getElementById("btn-auth-3d-view");
if (btnAuthMapView && btnAuth3DView) {
  btnAuthMapView.addEventListener("click", () => {
    btnAuthMapView.classList.add("btn-active");
    btnAuth3DView.classList.remove("btn-active");
    document.getElementById("authority-vector-map").classList.remove("hidden");
    document.getElementById("authority-3d-container").classList.add("hidden");
  });

  btnAuth3DView.addEventListener("click", () => {
    btnAuth3DView.classList.add("btn-active");
    btnAuthMapView.classList.remove("btn-active");
    document.getElementById("authority-3d-container").classList.remove("hidden");
    document.getElementById("authority-vector-map").classList.add("hidden");
  });
}

// ==========================================================
// 4. Interactive Vector 2D Maps (Canvas Rendered)
// ==========================================================
function drawVectorMap(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;

  // Fit sizes
  canvas.width = parent.clientWidth * dpr;
  canvas.height = parent.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  const w = parent.clientWidth;
  const h = parent.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  // Clear background
  ctx.fillStyle = "#070b15";
  ctx.fillRect(0, 0, w, h);

  // 1. Draw grid lines
  ctx.strokeStyle = "rgba(59, 130, 246, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // 2. Draw Simulated Coastal outlines for Puducherry (vector points)
  ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
  ctx.fillStyle = "rgba(59, 130, 246, 0.02)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Coastline moving from north to south
  ctx.moveTo(cx + 80, 0);
  ctx.bezierCurveTo(cx + 60, h * 0.3, cx + 50, h * 0.6, cx + 30, h);
  ctx.lineTo(0, h);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw sea label
  ctx.font = "italic 10px sans-serif";
  ctx.fillStyle = "rgba(96, 165, 250, 0.3)";
  ctx.fillText("BAY OF BENGAL", cx + 110, h * 0.4);

  // 3. Draw Cyclone Sentinel bounds (concentric warning circles on East side)
  const cyc = db.disasters[0];
  if (cyc.active) {
    // Math position of cyclone on map
    const cycX = cx + 140;
    const cycY = h * 0.3;
    
    // Pulse bands
    const timeMs = new Date().getTime();
    const pulseOffset = (timeMs % 1500) / 1500;
    
    ctx.strokeStyle = "rgba(239, 68, 68, 0.08)";
    ctx.fillStyle = "rgba(239, 68, 68, 0.01)";
    
    // Outer warning zone
    ctx.beginPath();
    ctx.arc(cycX, cycY, 180, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Secondary banding
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 - pulseOffset*0.2})`;
    ctx.beginPath();
    ctx.arc(cycX, cycY, 100 + pulseOffset * 40, 0, Math.PI*2);
    ctx.stroke();

    // Cyclone eye marker
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cycX, cycY, 8, 0, Math.PI*2);
    ctx.fill();

    // Storm label
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("CYCLONE SENTINEL (CAT 3)", cycX - 70, cycY - 15);
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
    ctx.fillText(`${cyc.movement}`, cycX - 70, cycY - 2);
  }

  // 4. Draw Safe Shelters
  db.shelters.forEach(s => {
    // Map coords relative to Puducherry center (cx, cy)
    // Coords delta: s.coords.lat = 11.95, s.coords.lng = 79.80
    const sx = cx + (s.coords.lng - 79.8083) * 4000;
    const sy = cy - (s.coords.lat - 11.9416) * 4000;

    // Glowing base
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
    ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI*2); ctx.fill();

    // Shelter icon/circle
    ctx.fillStyle = "#10b981";
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.font = "bold 9px 'Outfit', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(s.name === "Puducherry North School Shelter" ? "SHELTER A" : "SHELTER B", sx + 10, sy + 3);
    
    // Capacity bar on map
    const ratio = s.current / s.capacity;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(sx - 15, sy - 14, 30, 4);
    ctx.fillStyle = ratio > 0.9 ? "#ef4444" : "#10b981";
    ctx.fillRect(sx - 15, sy - 14, 30 * ratio, 4);
  });

  // 5. Draw Routes (Route A & Route B)
  // Define route nodes relative to map center
  const nodeStart = { x: cx - 20, y: cy + 40 }; // Citizen Home area
  const nodeShelterA = { x: cx - 25, y: cy - 54 }; // School
  const nodeShelterB = { x: cx - 110, y: cy + 45 }; // Arena

  // Route A: Citizen -> Shelter B (Direct Corridor)
  ctx.strokeStyle = routesData.RouteA.safety > 80 ? "#10b981" : "#f59e0b";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(nodeStart.x, nodeStart.y);
  ctx.lineTo(nodeStart.x - 40, nodeStart.y + 10);
  ctx.lineTo(nodeShelterB.x, nodeShelterB.y);
  ctx.stroke();

  // Route B: Citizen -> Shelter A (Coastal Bypass) - closer to storm eye
  ctx.strokeStyle = routesData.RouteB.safety < 50 ? "#ef4444" : "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]); // dashed coastal route
  ctx.beginPath();
  ctx.moveTo(nodeStart.x, nodeStart.y);
  ctx.bezierCurveTo(nodeStart.x + 40, nodeStart.y - 10, nodeStart.x + 20, nodeStart.y - 60, nodeShelterA.x, nodeShelterA.y);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // Route labels
  ctx.font = "8px monospace";
  ctx.fillStyle = routesData.RouteA.safety > 80 ? "#10b981" : "#f59e0b";
  ctx.fillText(`Route A (${routesData.RouteA.safety}%)`, nodeStart.x - 70, nodeStart.y + 30);
  ctx.fillStyle = routesData.RouteB.safety < 50 ? "#ef4444" : "#f59e0b";
  ctx.fillText(`Route B (${routesData.RouteB.safety}%)`, nodeStart.x + 25, nodeStart.y - 25);

  // 6. Draw Citizen (Ananya Sen) location if logged in
  if (citizenLocation && citizenLocation.city === "Puducherry") {
    const px = cx + (citizenLocation.lng - 79.8083) * 4000;
    const py = cy - (citizenLocation.lat - 11.9416) * 4000;

    // Glowing radar ripple
    const timeMs = new Date().getTime();
    const rippleScale = ((timeMs % 2000) / 2000) * 20;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.beginPath(); ctx.arc(px, py, rippleScale, 0, Math.PI*2); ctx.stroke();

    ctx.fillStyle = "#3b82f6";
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText("Ananya (Citizen)", px + 10, py - 4);
  }

  // 7. Draw Swarm Telemetry Hazard report markers
  db.swarmReports.forEach(rep => {
    const rx = cx + (rep.coords.lng - 79.8083) * 4000;
    const ry = cy - (rep.coords.lat - 11.9416) * 4000;
    
    ctx.fillStyle = rep.type === "safe_route" ? "#10b981" : "#ef4444";
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.font = "8px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(rep.text, rx + 8, ry + 2);
  });

  // 8. Draw Incident requests mapping (pins on map)
  db.requests.forEach(r => {
    if (r.status === "Resolved") return;
    
    const ix = cx + (r.coords.lng - 79.8083) * 4000;
    const iy = cy - (r.coords.lat - 11.9416) * 4000;
    
    // flashing alert ring
    ctx.strokeStyle = r.priority === "Critical" ? "#ef4444" : "#f59e0b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ix, iy, 10, 0, Math.PI*2);
    ctx.stroke();

    // Pin dot
    ctx.fillStyle = r.priority === "Critical" ? "#ef4444" : "#f59e0b";
    ctx.beginPath();
    ctx.arc(ix, iy, 4, 0, Math.PI*2);
    ctx.fill();

    // label
    ctx.font = "9px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${r.id} [${r.category}]`, ix + 8, iy - 4);
  });

  // 9. Draw Volunteer (Ravi Kumar) if active
  const vol = db.volunteers[0];
  const vx = cx + (vol.coords.lng - 79.8083) * 4000;
  const vy = cy - (vol.coords.lat - 11.9416) * 4000;

  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  // Draw small responder motorcycle/arrow shape
  ctx.moveTo(vx, vy - 6);
  ctx.lineTo(vx + 5, vy + 4);
  ctx.lineTo(vx - 5, vy + 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.font = "bold 9px sans-serif";
  ctx.fillStyle = "#a7f3d0";
  ctx.fillText("Ravi (Volunteer)", vx + 8, vy + 6);
}

// Redraw loop for map movement animations (e.g. storm bands, ripples)
setInterval(() => {
  drawVectorMap("citizen-vector-map");
  drawVectorMap("authority-vector-map");
  drawVectorMap("volunteer-vector-map");
}, 250);
