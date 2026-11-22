// Sentinel Core Application Engine (Simulated Database, AI Workflows & State Machine)

// ==========================================
// 1. Simulated Database & State
// ==========================================
const db = {
  currentUser: null,
  
  disasters: [
    {
      id: "cyclone-sentinel",
      name: "Cyclone Sentinel",
      type: "Cyclone",
      severity: "High",
      radius: 120, // km
      position: { lat: 11.9416, lng: 79.8083 }, // Puducherry Center
      movement: "North-West at 15 km/h",
      population: "1.2 Million",
      active: true
    },
    {
      id: "flood-river",
      name: "Ganges River Overflow",
      type: "Flood",
      severity: "Medium",
      radius: 40,
      position: { lat: 25.26, lng: 82.98 }, // Varanasi Area
      movement: "Stationary",
      population: "350,000",
      active: false
    }
  ],

  requests: [
    {
      id: "SOS-8419",
      category: "Food",
      details: "Requesting dry food packets for a family of 4 stranded near high water.",
      locationName: "Villianur, Puducherry",
      coords: { lat: 11.913, lng: 79.760 },
      priority: "Medium",
      status: "Resolved",
      volunteerId: "vol-1",
      timestamp: "2026-06-06T10:30:00Z"
    },
    {
      id: "SOS-2940",
      category: "Shelter",
      details: "Water level rising near lowlands, seeking nearest safe shelter guidance.",
      locationName: "Mudaliarpet, Puducherry",
      coords: { lat: 11.918, lng: 79.810 },
      priority: "High",
      status: "Assigned",
      volunteerId: "vol-1",
      timestamp: "2026-06-06T12:45:00Z"
    }
  ],

  volunteers: [
    {
      id: "vol-1",
      name: "Ravi Kumar",
      email: "volunteer@sentinel.ai",
      status: "Active", // Active, Idle
      coords: { lat: 11.935, lng: 79.800 },
      activeJobId: "SOS-2940"
    }
  ],

  shelters: [
    {
      id: "shelter-a",
      name: "Puducherry North School Shelter",
      capacity: 800,
      current: 780,
      coords: { lat: 11.955, lng: 79.802 },
      resources: {
        water: 900, // liters (Warning level!)
        food: 1200, // rations
        medicine: 450, // kits
        beds: 20 // available
      }
    },
    {
      id: "shelter-b",
      name: "Central Sports Community Arena",
      capacity: 1500,
      current: 550,
      coords: { lat: 11.928, lng: 79.792 },
      resources: {
        water: 6500, // liters (Stable)
        food: 3200, // rations
        medicine: 900,
        beds: 950
      }
    }
  ],

  swarmReports: [
    { id: "sw-1", type: "flood_area", text: "Water logged up to 3 feet on Beach Rd near the lighthouse.", location: "Beach Road", coords: { lat: 11.933, lng: 79.817 } }
  ],

  offlineQueue: [],
  isOnline: true
};

// ==========================================
// 2. Authentication Logic
// ==========================================
function setDemoCredentials(email) {
  document.getElementById("auth-email").value = email;
  document.getElementById("auth-password").value = "demo1234";
  login();
}

function login() {
  const email = document.getElementById("auth-email").value.trim().toLowerCase();
  
  if (email === "citizen@sentinel.ai") {
    db.currentUser = { role: "citizen", name: "Ananya Sen", email };
    showPage("page-citizen");
    initializeCitizenState();
  } else if (email === "authority@sentinel.ai") {
    db.currentUser = { role: "authority", name: "Command Chief", email };
    showPage("page-authority");
    initializeAuthorityState();
  } else if (email === "volunteer@sentinel.ai") {
    db.currentUser = { role: "volunteer", name: "Ravi Kumar", email };
    showPage("page-volunteer");
    initializeVolunteerState();
  } else {
    alert("Please select or enter a valid demo account (citizen@sentinel.ai, authority@sentinel.ai, or volunteer@sentinel.ai).");
  }
}

function logout() {
  db.currentUser = null;
  showPage("page-landing");
  // Stop three.js loops on dashboards if active
  if (window.radarAnimId) cancelAnimationFrame(window.radarAnimId);
  if (window.netAnimId) cancelAnimationFrame(window.netAnimId);
}

function showPage(pageId) {
  const pages = document.querySelectorAll(".app-page");
  pages.forEach(p => p.classList.remove("active"));
  
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  }
}

// Bind auth forms
document.getElementById("auth-form").addEventListener("submit", login);
document.getElementById("btn-google-signin").addEventListener("click", () => {
  // Simulate google login by picking citizen as default
  setDemoCredentials("citizen@sentinel.ai");
});

// ==========================================
// 3. Location Detection & AI Threat Engine
// ==========================================
let citizenLocation = null;

function requestCitizenLocation(forceInDanger = false) {
  const coordsField = document.getElementById("citizen-coords");
  const cityField = document.getElementById("citizen-city");
  
  coordsField.innerText = "Scanning GPS Satellites...";
  
  setTimeout(() => {
    if (forceInDanger) {
      // Coordinates inside Puducherry (danger zone of the Cyclone)
      citizenLocation = {
        lat: 11.9380,
        lng: 79.8120,
        city: "Puducherry",
        state: "Puducherry UT"
      };
    } else {
      // Default: safe zone coords (e.g. Bangalore)
      citizenLocation = {
        lat: 12.9716,
        lng: 77.5946,
        city: "Bengaluru",
        state: "Karnataka"
      };
    }
    
    coordsField.innerText = `${citizenLocation.lat.toFixed(4)}° N, ${citizenLocation.lng.toFixed(4)}° E`;
    cityField.innerText = `${citizenLocation.city}, ${citizenLocation.state}`;
    
    // Evaluate risk score using AI Threat Engine
    evaluateRisk();
    // Redraw maps
    triggerMapRedraws();
  }, 1000);
}

function evaluateRisk() {
  if (!citizenLocation) return;
  
  const riskCard = document.getElementById("citizen-risk-card");
  const scoreText = document.getElementById("risk-score");
  const statusText = document.getElementById("risk-status");
  const descText = document.getElementById("risk-recommendations");
  const shelterCard = document.getElementById("citizen-safezone-card");
  
  // Find nearest active disaster
  let highestRisk = 0;
  let activeThreat = null;
  
  db.disasters.forEach(d => {
    if (!d.active) return;
    
    // Calculate distance (km)
    const dist = getDistance(citizenLocation.lat, citizenLocation.lng, d.position.lat, d.position.lng);
    if (dist < d.radius) {
      // Risk is inversely proportional to distance
      const risk = Math.round(100 - (dist / d.radius) * 75);
      if (risk > highestRisk) {
        highestRisk = risk;
        activeThreat = d;
      }
    }
  });
  
  if (highestRisk > 0 && activeThreat) {
    // Show risk
    scoreText.innerText = `${highestRisk}%`;
    
    riskCard.className = "glass-card danger-card";
    
    if (highestRisk > 75) {
      riskCard.classList.add("status-high");
      statusText.innerText = "CRITICAL / HIGH RISK";
      descText.innerHTML = `⚠️ <strong>${activeThreat.name}</strong> is centered ${getDistance(citizenLocation.lat, citizenLocation.lng, activeThreat.position.lat, activeThreat.position.lng).toFixed(1)} km away. <strong>Evacuate Immediately</strong> to designated safety shelter.`;
    } else {
      riskCard.classList.add("status-medium");
      statusText.innerText = "ELEVATED ALERT";
      descText.innerHTML = `🌧️ Peripheral bands of <strong>${activeThreat.name}</strong> active nearby. Avoid low-lying roads. Secure structures.`;
    }
    
    // Recommend nearest safe zone shelter
    shelterCard.classList.remove("hidden");
    populateNearestShelter();
  } else {
    // Low risk
    scoreText.innerText = "0%";
    riskCard.className = "glass-card danger-card status-low";
    statusText.innerText = "NO THREAT DETECTED";
    descText.innerText = "You are currently in a secure zone. Keep active to receive telemetry warnings if conditions shift.";
    shelterCard.classList.add("hidden");
  }
}

function populateNearestShelter() {
  const container = document.getElementById("citizen-shelter-details");
  if (!container || !citizenLocation) return;
  
  let nearest = null;
  let minDistance = Infinity;
  
  db.shelters.forEach(s => {
    const dist = getDistance(citizenLocation.lat, citizenLocation.lng, s.coords.lat, s.coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  });
  
  if (nearest) {
    // Math: 1 km takes about 12 minutes walking or 3 minutes driving in water logging
    const walkTime = Math.round(minDistance * 12);
    const driveTime = Math.round(minDistance * 4);
    
    // Capacity warning
    const capacityStatus = (nearest.current / nearest.capacity) > 0.9 ? 
      '<span class="badge badge-critical">NEAR CAPACITY</span>' : 
      '<span class="badge badge-success">SPACE AVAILABLE</span>';
    
    container.innerHTML = `
      <div class="job-meta-item">
        <span class="label">RECOMMENDED SHELTER</span>
        <span class="val">${nearest.name}</span>
      </div>
      <div class="job-meta-item" style="margin-top: 5px;">
        <span class="label">STATUS & CAPACITY</span>
        <span class="val">${nearest.current}/${nearest.capacity} Occupied ${capacityStatus}</span>
      </div>
      <div class="job-meta-item" style="margin-top: 5px;">
        <span class="label">AI ROUTE ASSESSMENT</span>
        <span class="val">Distance: ${minDistance.toFixed(2)} km | Walk: ~${walkTime} mins | Safety: 92%</span>
      </div>
      <div style="margin-top: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: hsl(var(--text-secondary)); margin-bottom: 4px;">Recommended Action</div>
        <p style="font-size: 12px; color: #fff;">Follow evacuation corridor North-West. Avoid coastal beach routes due to storm surge risk.</p>
      </div>
    `;
  }
}

// Distance helper (Haversine simple approximation)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

document.getElementById("btn-request-location").addEventListener("click", () => requestCitizenLocation(false));

// ==========================================
// 4. AI Request Prioritization Engine
// ==========================================
function parseNLPQueryPriority(text) {
  const query = text.toLowerCase();
  
  // Critical Words
  if (
    query.includes("oxygen") || 
    query.includes("heart") || 
    query.includes("dying") || 
    query.includes("breathing") || 
    query.includes("unconscious") || 
    query.includes("bleeding") ||
    query.includes("choking") ||
    query.includes("stroke")
  ) {
    return "Critical";
  }
  
  // High Words
  if (
    query.includes("trapped") || 
    query.includes("drowning") || 
    query.includes("flood") || 
    query.includes("rising") || 
    query.includes("collapsed") ||
    query.includes("broken bone") ||
    query.includes("rescue")
  ) {
    return "High";
  }
  
  // Medium Words
  if (
    query.includes("food") || 
    query.includes("starving") || 
    query.includes("water") || 
    query.includes("medicine") || 
    query.includes("fever") || 
    query.includes("shelter") || 
    query.includes("diabetic")
  ) {
    return "Medium";
  }
  
  return "Low";
}

function submitEmergencyRequest() {
  const category = document.querySelector('input[name="req-category"]:checked').value;
  const details = document.getElementById("req-details").value.trim();
  
  if (!details) return;
  
  const reqId = `SOS-${Math.floor(1000 + Math.random()*9000)}`;
  const priority = parseNLPQueryPriority(details);
  
  const newReq = {
    id: reqId,
    category: category,
    details: details,
    locationName: citizenLocation ? `${citizenLocation.city}, near coordinates` : "Puducherry Center",
    coords: citizenLocation ? { lat: citizenLocation.lat - 0.002, lng: citizenLocation.lng + 0.003 } : { lat: 11.9360, lng: 79.8150 },
    priority: priority,
    status: db.isOnline ? "Submitted" : "Queued",
    volunteerId: null,
    timestamp: new Date().toISOString()
  };

  if (!db.isOnline) {
    // Queue request for mesh relay offline mode
    db.offlineQueue.push(newReq);
    updateOfflineQueueUI();
    document.getElementById("req-details").value = "";
    alert("Network Connection Severed. SOS request queued in Offline Emergency Relay!");
    return;
  }
  
  db.requests.unshift(newReq);
  
  // Reset form
  document.getElementById("req-details").value = "";
  
  // Refresh views
  updateCitizenRequestsUI();
  updateAuthorityRequestsUI();
  updateVolunteerIncidentsUI();
  triggerMapRedraws();
  
  // Visual focus effect
  const cardList = document.getElementById("citizen-requests-list");
  if (cardList && cardList.firstElementChild) {
    cardList.firstElementChild.style.animation = "pulse-glow 1.5s ease";
  }
}

function updateCitizenRequestsUI() {
  const container = document.getElementById("citizen-requests-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (db.requests.length === 0) {
    container.innerHTML = `<div class="empty-state">No broadcast SOS signals on record.</div>`;
    return;
  }
  
  // Show all requests
  db.requests.forEach(r => {
    let pClass = r.priority.toLowerCase();
    
    // Status dot tracker
    let submittedDot = "active submitted";
    let prioritizedDot = r.status !== "Submitted" ? "active prioritized" : "";
    let assignedDot = (r.status !== "Submitted" && r.status !== "Prioritized") ? "active assigned" : "";
    let progressDot = r.status === "In Progress" || r.status === "Resolved" ? "active inprogress" : "";
    let resolvedDot = r.status === "Resolved" ? "active resolved" : "";
    
    const card = document.createElement("div");
    card.className = `request-card ${pClass}-border`;
    card.innerHTML = `
      <div class="req-header">
        <span class="req-id">${r.id}</span>
        <span class="badge badge-${pClass}">${r.priority}</span>
      </div>
      <div class="req-body">
        <strong>[${r.category}]</strong> ${r.details}
      </div>
      <div class="req-footer">
        <div class="req-status-tracker">
          <span class="status-dot ${submittedDot}" title="Submitted"></span>
          <span>➔</span>
          <span class="status-dot ${prioritizedDot}" title="Prioritized"></span>
          <span>➔</span>
          <span class="status-dot ${assignedDot}" title="Assigned"></span>
          <span>➔</span>
          <span class="status-dot ${progressDot}" title="In Progress"></span>
          <span>➔</span>
          <span class="status-dot ${resolvedDot}" title="Resolved"></span>
        </div>
        <div style="font-size: 11px; font-weight: 600; color: #fff;">${r.status}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 5. Offline Mode Logic
// ==========================================
function toggleNetworkStatus(role, isChecked) {
  db.isOnline = isChecked;
  
  // Sync all network status switches
  const toggles = ["network-toggle-citizen"];
  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = isChecked;
  });
  
  const labels = ["network-label-citizen"];
  labels.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isChecked) {
        el.innerText = "ONLINE MODE";
        el.className = "status-badge online";
      } else {
        el.innerText = "OFFLINE MESH MODE";
        el.className = "status-badge offline";
      }
    }
  });

  const watermark = document.getElementById("offline-watermark");
  if (watermark) {
    if (isChecked) watermark.classList.add("hidden");
    else watermark.classList.remove("hidden");
  }

  const visualizerCard = document.getElementById("offline-visualizer-card");
  if (visualizerCard) {
    if (isChecked) visualizerCard.classList.add("hidden");
    else {
      visualizerCard.classList.remove("hidden");
      animateMeshFlow();
    }
  }

  // If back online, flush offline queue
  if (db.isOnline && db.offlineQueue.length > 0) {
    db.offlineQueue.forEach(q => {
      q.status = "Submitted";
      db.requests.unshift(q);
    });
    db.offlineQueue = [];
    updateOfflineQueueUI();
    
    // Refresh interfaces
    updateCitizenRequestsUI();
    updateAuthorityRequestsUI();
    updateVolunteerIncidentsUI();
    triggerMapRedraws();
    
    alert("Reconnected! Syncing offline queue database with command nodes.");
  }
}

function updateOfflineQueueUI() {
  const queueInfo = document.getElementById("offline-queue-info");
  if (!queueInfo) return;
  
  if (db.offlineQueue.length === 0) {
    queueInfo.innerText = "Offline queue is empty. Requests will automatically wait here.";
    queueInfo.style.borderStyle = "dashed";
  } else {
    queueInfo.innerHTML = `🚨 <strong>${db.offlineQueue.length} SOS Signals Queued</strong><br>Broadcasting via Peer-to-Peer Mesh Relay...`;
    queueInfo.style.borderStyle = "solid";
  }
}

function animateMeshFlow() {
  if (db.isOnline) return;
  
  const nodes = [
    document.getElementById("mesh-node-citizen"),
    document.getElementById("mesh-node-hop"),
    document.getElementById("mesh-node-volunteer"),
    document.getElementById("mesh-node-hq")
  ];
  const arrows = [
    document.getElementById("mesh-arrow-1"),
    document.getElementById("mesh-arrow-2"),
    document.getElementById("mesh-arrow-3")
  ];
  
  let currentActive = 0;
  
  function step() {
    if (db.isOnline) return;
    
    // Reset
    nodes.forEach(n => n.classList.remove("active"));
    arrows.forEach(a => a.classList.remove("active"));
    
    // Make active
    nodes[currentActive].classList.add("active");
    if (currentActive > 0) {
      arrows[currentActive - 1].classList.add("active");
    }
    
    currentActive = (currentActive + 1) % nodes.length;
    setTimeout(step, 1500);
  }
  
  step();
}

// Bind citizen toggle
document.getElementById("network-toggle-citizen").addEventListener("change", (e) => {
  toggleNetworkStatus("citizen", e.target.checked);
});

// ==========================================
// 6. Authority command panel logic
// ==========================================
function updateAuthorityRequestsUI() {
  const container = document.getElementById("authority-requests-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (db.requests.length === 0) {
    container.innerHTML = `<div class="empty-state">No incoming requests.</div>`;
    return;
  }
  
  db.requests.forEach(r => {
    const card = document.createElement("div");
    card.className = `request-card ${r.priority.toLowerCase()}-border`;
    
    // Find assigned volunteer
    let assignSection = "";
    if (r.status === "Submitted" || r.status === "Prioritized") {
      assignSection = `
        <div style="margin-top: 8px;">
          <button class="btn btn-secondary btn-small" onclick="assignJobToVolunteer('${r.id}')">Dispatch Volunteer</button>
        </div>
      `;
    } else {
      const vol = db.volunteers.find(v => v.id === r.volunteerId);
      assignSection = `<div style="font-size: 11px; color: #10b981; font-weight: 500; margin-top: 4px;">Assigned to: ${vol ? vol.name : 'Unknown Responder'}</div>`;
    }
    
    card.innerHTML = `
      <div class="req-header">
        <span class="req-id">${r.id} | ${r.locationName}</span>
        <span class="badge badge-${r.priority.toLowerCase()}">${r.priority}</span>
      </div>
      <div class="req-body">
        <strong>[${r.category}]</strong> ${r.details}
      </div>
      <div class="req-footer">
        <div style="font-size: 11px; color: hsl(var(--text-secondary));">Status: <strong>${r.status}</strong></div>
        <div style="font-size: 10px; color: hsl(var(--text-muted));">${new Date(r.timestamp).toLocaleTimeString()}</div>
      </div>
      ${assignSection}
    `;
    container.appendChild(card);
  });
}

function updateThreatsUI() {
  const container = document.getElementById("authority-threat-list");
  if (!container) return;
  
  container.innerHTML = "";
  db.disasters.forEach(d => {
    const card = document.createElement("div");
    card.className = "authority-threat-card";
    
    const severityBadge = d.severity === "High" ? 
      '<span class="badge badge-critical">CRITICAL</span>' : 
      '<span class="badge badge-warning">ELEVATED</span>';
    
    card.innerHTML = `
      <div class="threat-head">
        <span>${d.name} (${d.type})</span>
        ${severityBadge}
      </div>
      <div class="threat-details">
        <span>📍 Epicenter Coords: ${d.position.lat}, ${d.position.lng}</span>
        <span>🌐 Impact Radius: ${d.radius} km</span>
        <span>🌪️ Vector Track: ${d.movement}</span>
        <span>👥 Population at Risk: ${d.population}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 7. Swarm Routing & Route Safety
// ==========================================
let routesData = {
  RouteA: { name: "Route A (Direct Corridor)", safety: 92, reports: 0 },
  RouteB: { name: "Route B (Coastal Bypass)", safety: 74, reports: 1 } // starts lower due to storm report
};

function submitSwarmReport() {
  const type = document.getElementById("swarm-report-type").value;
  const loc = document.getElementById("swarm-report-location").value.trim();
  
  if (!loc) return;
  
  const newReport = {
    id: `sw-${Math.floor(1000 + Math.random()*9000)}`,
    type: type,
    text: type === "safe_route" ? `Route confirmed clear near ${loc}` : `Hazard alert near ${loc}`,
    location: loc,
    coords: citizenLocation ? { lat: citizenLocation.lat + 0.004, lng: citizenLocation.lng - 0.003 } : { lat: 11.9480, lng: 79.8090 }
  };
  
  db.swarmReports.push(newReport);
  document.getElementById("swarm-report-location").value = "";
  
  // Process report with swarm intelligence - modify route safety scores
  if (type === "blocked_road" || type === "flood_area") {
    // coastal road reports damage route B
    routesData.RouteB.safety = Math.max(15, routesData.RouteB.safety - 40);
    routesData.RouteB.reports++;
  } else if (type === "safe_route") {
    routesData.RouteA.safety = Math.min(100, routesData.RouteA.safety + 5);
    routesData.RouteA.reports++;
  }
  
  alert("Swarm report compiled by AI. EVACUATON route safety indices updated.");
  
  // Refresh views
  triggerMapRedraws();
  
  // If user is volunteer, refresh the badge
  const safetyBadge = document.getElementById("route-safety-badge");
  if (safetyBadge) {
    safetyBadge.innerText = `Route A Safety: ${routesData.RouteA.safety}% | Route B: ${routesData.RouteB.safety}%`;
  }
}

// ==========================================
// 8. Crisis Forecasting Engine
// ==========================================
function updateCrisisForecasting() {
  const container = document.getElementById("authority-forecast-panel");
  if (!container) return;
  
  container.innerHTML = "";
  
  db.shelters.forEach(s => {
    // Rates: 3L water per person/day. 2 rations per person/day.
    const waterNeeded = s.current * 3;
    const waterStock = s.resources.water;
    
    // calculate hours remaining
    const hoursRemaining = Math.max(0, (waterStock / waterNeeded) * 24);
    
    let fClass = "warning-border";
    let status = "ELEVATED CONGESTION";
    let recommendation = "";
    
    if (hoursRemaining < 12) {
      fClass = "danger-border";
      status = "CRITICAL DEPLETON FORECAST";
      recommendation = `Divert central depot water container trucks to <strong>${s.name}</strong>. Expected dehydration crisis in ${hoursRemaining.toFixed(1)} hours.`;
    } else {
      recommendation = `Resources healthy at <strong>${s.name}</strong>. Re-evaluate stocks in 12 hours.`;
    }
    
    const item = document.createElement("div");
    item.className = `forecast-item ${fClass}`;
    item.innerHTML = `
      <div class="forecast-meta">
        <span>${s.name}</span>
        <span class="badge ${hoursRemaining < 12 ? 'badge-critical' : 'badge-warning'}">${status}</span>
      </div>
      <div class="forecast-desc">
        Shelter Occupancy: ${s.current}/${s.capacity} (${Math.round((s.current/s.capacity)*100)}%).<br>
        Water Stock: ${waterStock} L | Daily Burn: ${waterNeeded} L.<br>
        <strong>Est. Water Exhaustion: ${hoursRemaining.toFixed(1)} Hours</strong>
      </div>
      <div class="forecast-action">${recommendation}</div>
    `;
    container.appendChild(item);
  });
}

function replenishResources(depotName) {
  // Transfer stocks from depot to shelters
  db.shelters.forEach(s => {
    if (s.resources.water < 2000) {
      s.resources.water += 3000;
    }
    if (s.resources.food < 1500) {
      s.resources.food += 2000;
    }
    s.resources.medicine += 500;
  });
  
  // Update UI variables
  document.getElementById("res-val-water").innerText = "7,500 L";
  document.getElementById("res-bar-water").style.width = "95%";
  document.getElementById("res-bar-water").className = "progress-fill green";
  
  document.getElementById("res-val-food").innerText = "3,200 Units";
  document.getElementById("res-bar-food").style.width = "85%";
  document.getElementById("res-bar-food").className = "progress-fill green";

  document.getElementById("res-val-shelter").innerText = "280 Units";
  document.getElementById("res-bar-shelter").style.width = "75%";
  document.getElementById("res-bar-shelter").className = "progress-fill green";
  
  updateCrisisForecasting();
  alert("Command Resource Depot Dispatch: Emergency supply trucks dispatched to all shelters.");
}

// ==========================================
// 9. Misinformation Detection Engine
// ==========================================
const rumorFactsDatabase = [
  {
    keywords: ["dam", "breached", "broken", "reservoir"],
    status: "False",
    explanation: "Telemetry sensors at the Sathanur Dam confirm water level is 4.5m below warning mark. Structural concrete integrity checks are 100% normal."
  },
  {
    keywords: ["cyclone", "speed", "wind", "category"],
    status: "Verified",
    explanation: "Meteorological radar tracks core wind gusts at 185 km/h. Fits Category 3 severe storm classification."
  },
  {
    keywords: ["drinking", "saline", "salt", "prevent"],
    status: "False",
    explanation: "Consuming sea water causes extreme cellular dehydration and renal stress. Emergency guidelines strongly advise only drinking bottled or filtered water."
  }
];

function verifyRumorText() {
  const text = document.getElementById("rumor-input").value.trim();
  if (!text) return;
  
  const resultBox = document.getElementById("misinfo-result");
  resultBox.classList.remove("hidden");
  
  const lowerText = text.toLowerCase();
  
  // search
  let matchedFact = null;
  for (let fact of rumorFactsDatabase) {
    let matchesAll = fact.keywords.some(kw => lowerText.includes(kw));
    if (matchesAll) {
      matchedFact = fact;
      break;
    }
  }
  
  if (matchedFact) {
    resultBox.className = `misinfo-result-box ${matchedFact.status.toLowerCase()}`;
    resultBox.innerHTML = `
      <div class="misinfo-title">AI Assessment: ${matchedFact.status}</div>
      <p style="color: #fff; font-size: 12px; line-height: 1.4;">${matchedFact.explanation}</p>
    `;
  } else {
    resultBox.className = `misinfo-result-box unknown`;
    resultBox.innerHTML = `
      <div class="misinfo-title">AI Assessment: UNKNOWN / UNVERIFIED</div>
      <p style="color: #fff; font-size: 12px; line-height: 1.4;">No telemetry correlates found. Ground reconnaissance unit #4 has been queued to double-check this location.</p>
    `;
  }
  
  document.getElementById("rumor-input").value = "";
}

// ==========================================
// 10. Volunteer Dashboard Logic
// ==========================================
function updateVolunteerIncidentsUI() {
  const container = document.getElementById("volunteer-incident-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Filter only jobs that are not resolved yet
  const openJobs = db.requests.filter(r => r.status !== "Resolved");
  
  if (openJobs.length === 0) {
    container.innerHTML = `<div class="empty-state">No open incidents in your sector. Standby for dispatch.</div>`;
    return;
  }
  
  openJobs.forEach(r => {
    const isAssignedToMe = r.volunteerId === "vol-1";
    const statusText = isAssignedToMe ? `Assigned to You (${r.status})` : `Open - Prioritized`;
    
    let btnSection = "";
    if (r.status === "Submitted" || r.status === "Prioritized") {
      btnSection = `<button class="btn btn-secondary btn-small btn-block" onclick="volunteerAcceptJob('${r.id}')">Accept Task</button>`;
    } else if (isAssignedToMe && r.status === "Assigned") {
      btnSection = `<button class="btn btn-primary btn-small btn-block" onclick="volunteerStartJob('${r.id}')">Initiate Evacuation Route</button>`;
    } else if (isAssignedToMe && r.status === "In Progress") {
      btnSection = `<button class="btn btn-danger btn-small btn-block" onclick="volunteerCompleteJob('${r.id}')">Confirm Safe Arrival & Resolve</button>`;
    }
    
    const card = document.createElement("div");
    card.className = `request-card ${r.priority.toLowerCase()}-border`;
    card.innerHTML = `
      <div class="req-header">
        <span class="req-id">${r.id} | ${r.locationName}</span>
        <span class="badge badge-${r.priority.toLowerCase()}">${r.priority}</span>
      </div>
      <div class="req-body">
        <strong>[${r.category}]</strong> ${r.details}
      </div>
      <div class="req-footer">
        <span style="font-size: 11px; color: #fff; font-weight: 500;">${statusText}</span>
      </div>
      <div style="margin-top: 8px;">
        ${btnSection}
      </div>
    `;
    container.appendChild(card);
  });
}

function updateVolunteerActiveJobUI() {
  const container = document.getElementById("volunteer-assigned-job");
  if (!container) return;
  
  // Find if volunteer is assigned to a job
  const myVol = db.volunteers.find(v => v.id === "vol-1");
  const activeJob = db.requests.find(r => r.id === myVol.activeJobId && r.status !== "Resolved");
  
  if (!activeJob) {
    myVol.activeJobId = null;
    container.innerHTML = `<div class="empty-state">No currently accepted dispatch route. Select a critical incident from the adjacent radar list to begin evacuation/relief.</div>`;
    return;
  }
  
  const categoryIcon = activeJob.category === "Ambulance" ? "🚑" : "📦";
  
  let actionBtn = "";
  if (activeJob.status === "Assigned") {
    actionBtn = `<button class="btn btn-primary btn-block" onclick="volunteerStartJob('${activeJob.id}')">Navigate EVAC Route</button>`;
  } else if (activeJob.status === "In Progress") {
    actionBtn = `<button class="btn btn-danger btn-block" onclick="volunteerCompleteJob('${activeJob.id}')">Arrived at Shelter & Resolve Case</button>`;
  }
  
  container.innerHTML = `
    <div class="volunteer-job-box">
      <div class="job-meta-item">
        <span class="label">Incident Target ID</span>
        <span class="val">${activeJob.id} (${activeJob.priority} Priority)</span>
      </div>
      <div class="job-meta-item">
        <span class="label">Request Details</span>
        <span class="val"><strong>${categoryIcon} ${activeJob.category}</strong>: ${activeJob.details}</span>
      </div>
      <div class="job-meta-item">
        <span class="label">Location</span>
        <span class="val">${activeJob.locationName}</span>
      </div>
      <div class="job-meta-item">
        <span class="label">Evacuation Endpoint</span>
        <span class="val">Puducherry Central Sports Arena (Route A Safety: ${routesData.RouteA.safety}%)</span>
      </div>
      <div style="margin-top: 10px;">
        ${actionBtn}
      </div>
    </div>
  `;
}

function volunteerAcceptJob(jobId) {
  const req = db.requests.find(r => r.id === jobId);
  if (!req) return;
  
  req.status = "Assigned";
  req.volunteerId = "vol-1";
  
  const myVol = db.volunteers.find(v => v.id === "vol-1");
  myVol.activeJobId = jobId;
  myVol.status = "Active";
  
  // Refresh views
  updateVolunteerActiveJobUI();
  updateVolunteerIncidentsUI();
  updateCitizenRequestsUI();
  updateAuthorityRequestsUI();
  triggerMapRedraws();
  
  alert(`Task accepted. Dispatching coordinates mapped to GPS overlay.`);
}

function volunteerStartJob(jobId) {
  const req = db.requests.find(r => r.id === jobId);
  if (!req) return;
  
  req.status = "In Progress";
  
  // Refresh
  updateVolunteerActiveJobUI();
  updateVolunteerIncidentsUI();
  updateCitizenRequestsUI();
  updateAuthorityRequestsUI();
  triggerMapRedraws();
}

function volunteerCompleteJob(jobId) {
  const req = db.requests.find(r => r.id === jobId);
  if (!req) return;
  
  req.status = "Resolved";
  
  const myVol = db.volunteers.find(v => v.id === "vol-1");
  myVol.activeJobId = null;
  myVol.status = "Idle";
  
  // shelter increments current count
  const nearestShelter = db.shelters[1]; // Central Sports Arena
  if (nearestShelter.current < nearestShelter.capacity) {
    nearestShelter.current += 1;
  }
  
  // Refresh
  updateVolunteerActiveJobUI();
  updateVolunteerIncidentsUI();
  updateCitizenRequestsUI();
  updateAuthorityRequestsUI();
  updateCrisisForecasting();
  triggerMapRedraws();
  
  alert("Mission Accomplished: Evacuees safely delivered. Command database records synced.");
}

function assignJobToVolunteer(jobId) {
  // Authority manually dispatches volunteer
  const req = db.requests.find(r => r.id === jobId);
  if (!req) return;
  
  req.status = "Assigned";
  req.volunteerId = "vol-1";
  
  const myVol = db.volunteers.find(v => v.id === "vol-1");
  myVol.activeJobId = jobId;
  myVol.status = "Active";
  
  updateAuthorityRequestsUI();
  updateVolunteerIncidentsUI();
  updateVolunteerActiveJobUI();
  updateCitizenRequestsUI();
  triggerMapRedraws();
  
  alert("Command Dispatch: Incident assigned to Volunteer Ravi Kumar.");
}

// ==========================================
// 11. Initializers
// ==========================================
function initializeCitizenState() {
  document.getElementById("citizen-badge-name").innerText = db.currentUser.name;
  requestCitizenLocation(true); // default inside danger zone for demo cyclone
  updateCitizenRequestsUI();
  
  // Initial maps
  setTimeout(() => {
    initThreeDRiskRadar();
    triggerMapRedraws();
  }, 100);
}

function initializeAuthorityState() {
  updateThreatsUI();
  updateAuthorityRequestsUI();
  updateCrisisForecasting();
  
  // Init 3D flow network
  setTimeout(() => {
    initThreeDCommandNetwork();
    triggerMapRedraws();
  }, 100);
}

function initializeVolunteerState() {
  document.getElementById("volunteer-badge-name").innerText = db.currentUser.name;
  updateVolunteerActiveJobUI();
  updateVolunteerIncidentsUI();
  
  // Refresh volunteer route map safety badge
  const safetyBadge = document.getElementById("route-safety-badge");
  if (safetyBadge) {
    safetyBadge.innerText = `Route A Safety: ${routesData.RouteA.safety}% | Route B: ${routesData.RouteB.safety}%`;
  }
  
  setTimeout(() => {
    triggerMapRedraws();
  }, 100);
}

function triggerMapRedraws() {
  // Request redraw of vector maps
  if (typeof drawVectorMap === 'function') {
    drawVectorMap("citizen-vector-map");
    drawVectorMap("authority-vector-map");
    drawVectorMap("volunteer-vector-map");
  }
}

// ==========================================
// 12. Dynamic Product Tour & Onboarding Logic
// ==========================================
function updateDemoPanelHeight() {
  const panel = document.getElementById("demo-controller-panel");
  if (panel) {
    const height = panel.offsetHeight;
    document.documentElement.style.setProperty("--demo-panel-height", `${height}px`);
  }
}
window.addEventListener("resize", updateDemoPanelHeight);
window.addEventListener("load", updateDemoPanelHeight);
document.addEventListener("DOMContentLoaded", updateDemoPanelHeight);

function triggerTourHighlight(targetId, title, what, why, how, stepNum) {
  // Clear any existing highlights
  document.querySelectorAll('.feature-highlight').forEach(el => el.classList.remove('feature-highlight'));
  document.querySelectorAll('.feature-highlight-parent').forEach(el => el.classList.remove('feature-highlight-parent'));

  const target = document.getElementById(targetId);
  const popover = document.getElementById("tour-popover");
  const overlay = document.getElementById("tour-overlay");

  if (!target || !popover) return;

  // Highlight target card
  target.classList.add("feature-highlight");

  // Highlight parent card (if any) to prevent dimming/blurring and elevate it
  const parentCard = target.closest('.glass-card');
  if (parentCard) {
    parentCard.classList.add("feature-highlight-parent");
  }

  // Populate content
  document.getElementById("tour-title").innerText = title;
  document.getElementById("tour-what").innerText = what;
  document.getElementById("tour-why").innerText = why;
  document.getElementById("tour-how").innerText = how;
  document.getElementById("tour-step-tag").innerText = `STEP ${stepNum} TELEMETRY`;

  // Add tour-active class to page for CSS dimming effect
  document.querySelectorAll('.app-page.active').forEach(p => p.classList.add('tour-active'));

  // Display overlay
  overlay.classList.remove("hidden");
  popover.classList.remove("hidden");

  // Wire footer button to proceed to next step
  const nextBtn = document.getElementById("btn-tour-next");
  if (nextBtn) {
    if (stepNum === 9) {
      nextBtn.innerText = "Finish & Restart";
    } else {
      nextBtn.innerText = `Proceed to Step ${stepNum + 1}`;
    }
    nextBtn.onclick = () => {
      advanceDemoStep();
    };
  }

  // Measure and update bottom panel height
  updateDemoPanelHeight();

  // Scroll target into view instantly (so the bounding rect is immediately accurate)
  target.scrollIntoView({ behavior: 'auto', block: 'center' });

  // Re-fetch rect after layout settles
  setTimeout(() => {
    const rect = target.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popoverWidth = 330;
    const popoverHeight = 300; // estimated maximum height

    const demoPanel = document.getElementById("demo-controller-panel");
    const demoHeight = demoPanel ? demoPanel.offsetHeight : 140;
    const maxAllowedY = screenHeight - demoHeight - 10;

    let top = rect.top;
    let left = rect.right + 20;

    if (screenWidth < 640) {
      // Mobile: set width to full-width-minus-padding and position above/below target
      popover.style.width = "calc(100vw - 30px)";
      popover.style.maxWidth = "340px";
      left = (screenWidth - Math.min(340, screenWidth - 30)) / 2;
      top = rect.bottom + 15;

      // Check if it fits below the target and above the demo panel
      if (top + popoverHeight > maxAllowedY) {
        // Try placing above the target
        top = rect.top - popoverHeight - 15;
        if (top < 10) {
          // Center vertically in the remaining space if it doesn't fit either side
          top = Math.max(10, (maxAllowedY - popoverHeight) / 2);
        }
      }
    } else {
      // Desktop: place to the right, or left
      popover.style.width = "330px";
      popover.style.maxWidth = "none";
      
      // Try placing to the right
      if (left + popoverWidth > screenWidth - 15) {
        // Try placing to the left
        left = rect.left - popoverWidth - 20;
      }
      
      // If it still overflows or goes off screen, center horizontally
      if (left < 10 || left + popoverWidth > screenWidth) {
        left = (screenWidth - popoverWidth) / 2;
        top = rect.bottom + 15;
        
        if (top + popoverHeight > maxAllowedY) {
          top = rect.top - popoverHeight - 15;
        }
      } else {
        // Adjust vertical position to align with top of target, but stay within bounds
        top = rect.top;
        if (top + popoverHeight > maxAllowedY) {
          top = maxAllowedY - popoverHeight;
        }
        if (top < 10) {
          top = 10;
        }
      }
    }

    // Set styles
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.right = "auto";
    popover.style.bottom = "auto";
  }, 80);
}

function closeTour() {
  document.getElementById("tour-overlay").classList.add("hidden");
  document.getElementById("tour-popover").classList.add("hidden");
  document.querySelectorAll('.feature-highlight').forEach(el => el.classList.remove('feature-highlight'));
  document.querySelectorAll('.feature-highlight-parent').forEach(el => el.classList.remove('feature-highlight-parent'));
  document.querySelectorAll('.tour-active').forEach(el => el.classList.remove('tour-active'));
}

function restartTour() {
  resetDemo();
  // start first step
  advanceDemoStep();
}

// ==========================================
// 13. Map Interactivity & Click Collision Detection
// ==========================================
function bindMapClickEvents() {
  const mapIds = ["citizen-vector-map", "authority-vector-map", "volunteer-vector-map"];
  
  mapIds.forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      // 1. Check intersection with Shelters
      for (let s of db.shelters) {
        const sx = cx + (s.coords.lng - 79.8083) * 4000;
        const sy = cy - (s.coords.lat - 11.9416) * 4000;
        
        const dist = Math.hypot(clickX - sx, clickY - sy);
        if (dist < 18) {
          showTelemetryAlert(
            `🏢 Shelter Telemetry: ${s.name}`, 
            `Occupancy: ${s.current} / ${s.capacity} Evacuees\n` + 
            `💧 Fresh Water: ${s.resources.water} Liters\n` + 
            `🍞 Food Rations: ${s.resources.food} Units\n` + 
            `💊 Medical Kits: ${s.resources.medicine} Kits\n` + 
            `Status: ${((s.current / s.capacity) > 0.9) ? "CRITICAL CONGESTION" : "STABLE CAPACITY"}`
          );
          return;
        }
      }

      // 2. Check intersection with Active SOS Incidents
      for (let r of db.requests) {
        if (r.status === "Resolved") continue;
        const ix = cx + (r.coords.lng - 79.8083) * 4000;
        const iy = cy - (r.coords.lat - 11.9416) * 4000;

        const dist = Math.hypot(clickX - ix, clickY - iy);
        if (dist < 15) {
          showTelemetryAlert(
            `🚨 Distress Signal: ${r.id}`,
            `Category: ${r.category}\n` +
            `Priority: ${r.priority} Urgency (AI Scored)\n` +
            `Location: ${r.locationName}\n` +
            `Details: "${r.details}"\n` +
            `Current Status: ${r.status}`
          );
          return;
        }
      }
    });
  });
}

function showTelemetryAlert(title, text) {
  // Render a gorgeous browser-native notification wrapper or prompt
  alert(`${title}\n-----------------------------------\n${text}`);
}

// Bind clicks on load
window.addEventListener("DOMContentLoaded", () => {
  bindMapClickEvents();
});


// ==========================================
// 14. Crisis Mode Activator
// ==========================================
function activateCrisisMode() {
  // Flash all glass-cards red
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(c => {
    c.classList.add('crisis-mode-active');
    setTimeout(() => c.classList.remove('crisis-mode-active'), 4200);
  });

  // Accelerate shelter depletion for demo impact
  if (db.shelters[0]) {
    db.shelters[0].resources.water = Math.max(0, db.shelters[0].resources.water - 400);
  }

  // Inject a new Critical SOS request
  const crisisReq = {
    id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 'Rescue',
    details: 'CRISIS MODE: Multiple families trapped on rooftop as floodwater rises rapidly. Immediate aerial rescue required.',
    locationName: 'Lawspet, Puducherry',
    coords: { lat: 11.944, lng: 79.798 },
    priority: 'Critical',
    status: 'Submitted',
    volunteerId: null,
    timestamp: new Date().toISOString()
  };
  db.requests.unshift(crisisReq);

  // Push AI agent alert
  pushAgentLog('CRISIS', 'Mass distress surge detected. Escalating all SOS queues to Critical watch.', 'red');

  // Mark timeline node as crisis
  const crisisNodes = document.querySelectorAll('.t-node[id*="node-t18"]');
  crisisNodes.forEach(n => {
    n.classList.remove('active', 'completed');
    n.classList.add('crisis');
  });

  // Refresh all UIs
  updateCitizenRequestsUI();
  updateAuthorityRequestsUI();
  updateVolunteerIncidentsUI();
  updateCrisisForecasting();
  triggerMapRedraws();

  // Visual alert
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:3000;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:12px 28px;border-radius:8px;font-family:var(--font-family-title);font-weight:700;font-size:14px;letter-spacing:0.05em;box-shadow:0 0 30px rgba(239,68,68,0.6);animation:slide-in 0.3s ease;';
  alertDiv.textContent = '🚨 CRISIS MODE ACTIVATED — All units on high alert';
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3500);
}

// ==========================================
// 15. What-If Scenario Simulator
// ==========================================
function runWhatIf(scenario) {
  const outputBox = document.getElementById('what-if-output');
  const outputText = document.getElementById('what-if-output-text');
  if (!outputBox || !outputText) return;

  const outcomes = {
    rainfall: {
      title: '🌧️ +30% Rainfall Surge',
      text: 'Flood depth rises +1.4m in low-lying sectors. Shelter A hits 98% capacity within 4 hours. Route B becomes impassable. AI recommends: Pre-position 12 rescue boats at Mudaliarpet.',
      color: '#3b82f6',
      agent: 'WATER',
      agentId: 'agent-water'
    },
    capacity: {
      title: '🏥 -20% Bed Space Lost',
      text: 'Puducherry North School loses 160 beds due to structural damage. 340 evacuees require rerouting to Sports Arena (Shelter B). Water depletion at Shelter A projected in 6.1 hours.',
      color: '#f59e0b',
      agent: 'SHLTR',
      agentId: 'agent-shelter'
    },
    mesh: {
      title: '📶 Cellular Grid Failure',
      text: 'All 3 communication towers offline. Mesh relay network activates across 48 citizen devices. SOS signals rerouting via peer-to-peer hops. Estimated sync delay: 4.2 minutes.',
      color: '#f97316',
      agent: 'TRANS',
      agentId: 'agent-trans'
    }
  };

  const result = outcomes[scenario];
  if (!result) return;

  outputBox.style.borderLeftColor = result.color;
  outputBox.querySelector('.output-title').style.color = result.color;
  outputBox.querySelector('.output-title').textContent = 'AI Projected Outcome: ' + result.title;
  outputText.textContent = result.text;
  outputBox.classList.remove('hidden');

  // Highlight the relevant agent node
  document.querySelectorAll('.agent-node').forEach(n => n.classList.remove('active-agent'));
  const agentNode = document.getElementById(result.agentId);
  if (agentNode) agentNode.classList.add('active-agent');

  // Push to AI terminal
  pushAgentLog(result.agent, result.text.substring(0, 80) + '...', 'yellow');
}

// ==========================================
// 16. AI Agent Log Terminal Ticker
// ==========================================
const agentLogMessages = [
  ['MED', 'Scanning hospital inventory across 4 active facilities...', 'green'],
  ['WATER', 'Water depletion forecast updated. Shelter A: 9.2h remaining.', 'yellow'],
  ['FOOD', 'Ration distribution optimized. 2,400 packets dispatched.', 'green'],
  ['SHLTR', 'Occupancy model recalibrated. Surge threshold: 94%.', 'green'],
  ['TRANS', 'Route A confirmed clear. Route B: 2 new hazard nodes.', 'blue'],
  ['MED', 'Critical SOS detected. Ambulance vector calculated.', 'red'],
  ['WATER', 'Depot truck dispatch confirmed. ETA to Shelter A: 22 min.', 'green'],
  ['SHLTR', 'New evacuee batch of 140 persons incoming to Arena.', 'blue'],
];

let agentLogIndex = 0;

function pushAgentLog(agent, msg, dotColor) {
  const terminal = document.getElementById('ai-agent-log-terminal');
  if (!terminal) return;

  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}]`;

  const line = document.createElement('div');
  line.className = 'terminal-line';
  const colorMap = { green:'#a3e635', red:'#ef4444', yellow:'#f59e0b', blue:'#60a5fa' };
  const c = colorMap[dotColor] || '#a3e635';
  line.innerHTML = `<span class="t-stamp">${timeStr}</span><span style="color:${c};font-weight:700;">[${agent}]</span> ${msg}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  // Cap at 20 lines
  while (terminal.children.length > 20) {
    terminal.removeChild(terminal.firstChild);
  }
}

function tickAgentLog() {
  const entry = agentLogMessages[agentLogIndex % agentLogMessages.length];
  pushAgentLog(entry[0], entry[1], entry[2]);

  // Pulse the matching agent node
  const agentIdMap = { MED:'agent-med', FOOD:'agent-food', WATER:'agent-water', SHLTR:'agent-shelter', TRANS:'agent-trans' };
  const nodeId = agentIdMap[entry[0]];
  if (nodeId) {
    const node = document.getElementById(nodeId);
    if (node) {
      node.classList.add('active-agent');
      setTimeout(() => node.classList.remove('active-agent'), 2200);
    }
  }

  agentLogIndex++;
}

// Start agent log ticker every 4 seconds
setInterval(tickAgentLog, 4000);

// ==========================================
// 17. Timeline Node Progression
// ==========================================
function progressTimeline(prefix, stepIndex) {
  // stepIndex 0-6 maps to node ids t0, t6, t12, t18, t24, t36, t48
  const nodeIds = ['t0','t6','t12','t18','t24','t36','t48'];
  nodeIds.forEach((nid, i) => {
    const node = document.getElementById(`${prefix}-node-${nid}`);
    if (!node) return;
    node.classList.remove('active','completed','crisis');
    if (i < stepIndex) node.classList.add('completed');
    else if (i === stepIndex) node.classList.add('active');
  });
}

// ==========================================
// 18. Mission Success Screen
// ==========================================
function showMissionSuccess() {
  const overlay = document.getElementById('mission-success-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    // Hide demo controller during success screen
    const demoPanel = document.getElementById('demo-controller-panel');
    if (demoPanel) demoPanel.style.opacity = '0';
    setTimeout(() => {
      if (demoPanel) demoPanel.style.opacity = '1';
    }, 6000);
  }
}



