// Sentinel Integrated Scenario Simulator (Step-by-Step Scenario Player)

let currentDemoStep = 1;
const totalSteps = 9;

const scenarioSteps = {
  1: {
    desc: "<strong>Step 1: Disaster Detected</strong> — Cyclone Sentinel approaches Puducherry at 185 km/h. Global telemetry active.",
    timelinePrefix: null,
    timelineStep: 0,
    action: () => {
      db.disasters[0].active = true;
      db.disasters[0].severity = "High";
      logout();
      showPage("page-landing");
      triggerMapRedraws();
      setTimeout(() => {
        triggerTourHighlight(
          "landing-globe-canvas-container",
          "📡 Meteorological Detection",
          "Cyclone Sentinel is tracked approaching the Puducherry coast.",
          "Early detection enables proactive evacuation planning — saving hours of critical response time.",
          "Uses WebGL 3D rendering with real-time storm vector parameters.",
          1
        );
      }, 500);
    }
  },
  2: {
    desc: "<strong>Step 2: Citizen At Risk</strong> — Ananya Sen logs in. GPS places her inside the cyclone danger zone. AI Risk Engine: 92%.",
    timelinePrefix: "citizen",
    timelineStep: 1,
    action: () => {
      document.getElementById("auth-email").value = "citizen@sentinel.ai";
      login();
      requestCitizenLocation(true);
      setTimeout(() => {
        progressTimeline("citizen", 1);
        triggerTourHighlight(
          "citizen-risk-card",
          "🚨 AI Threat Proximity Engine",
          "GPS coordinates place Ananya inside the cyclone radius — AI triggers a 92% danger advisory.",
          "Generic alerts fail individuals. Sentinel gives personalized, location-specific threat scoring.",
          "Haversine formula calculates exact distance from disaster epicenter and maps to risk percentage.",
          2
        );
      }, 1200);
    }
  },
  3: {
    desc: "<strong>Step 3: SOS Broadcast</strong> — Ananya types: 'Heart patient needs oxygen. Requesting ambulance.'",
    timelinePrefix: "citizen",
    timelineStep: 2,
    action: () => {
      showPage("page-citizen");
      document.querySelector('input[name="req-category"][value="Ambulance"]').checked = true;
      document.getElementById("req-details").value = "Heart patient needs oxygen. Requesting ambulance.";
      progressTimeline("citizen", 2);
      triggerTourHighlight(
        "emergency-request-form",
        "🏥 Emergency Asset Request",
        "Ananya broadcasts an SOS — 'Heart patient needs oxygen. Requesting ambulance.'",
        "Citizens need a single tap to request rescue, medicine, water, or shelter — even with shaking hands.",
        "Categorized requests link GPS coordinates directly to Command Center dispatch queues.",
        3
      );
    }
  },
  4: {
    desc: "<strong>Step 4: AI Triage</strong> — Sentinel's NLP engine detects 'heart' + 'oxygen' and flags as <strong>CRITICAL</strong> instantly.",
    timelinePrefix: "citizen",
    timelineStep: 2,
    action: () => {
      submitEmergencyRequest();
      setTimeout(() => {
        progressTimeline("citizen", 3);
        triggerTourHighlight(
          "citizen-requests-list",
          "📋 NLP Priority Classification",
          "AI scans the text and tags this SOS as Critical within milliseconds.",
          "Manual triage bottlenecks cost lives. Critical cases must surface to the top automatically.",
          "Keyword weight matrix: oxygen/heart = Critical (70pts) + proximity score = final priority.",
          4
        );
      }, 500);
    }
  },
  5: {
    desc: "<strong>Step 5: Command Center</strong> — Authority logs in. Critical SOS appears at the top of the triage feed.",
    timelinePrefix: "auth",
    timelineStep: 3,
    action: () => {
      logout();
      document.getElementById("auth-email").value = "authority@sentinel.ai";
      login();
      setTimeout(() => {
        progressTimeline("auth", 3);
        triggerTourHighlight(
          "authority-requests-list",
          "💻 Command Triage Console",
          "Commander sees the critical SOS at the very top — sorted by AI priority score.",
          "Commanders face hundreds of signals simultaneously. AI sorting ensures no critical case is missed.",
          "Priority queue dynamically reorders all incoming SOS signals by computed urgency index.",
          5
        );
      }, 500);
    }
  },
  6: {
    desc: "<strong>Step 6: Tactical Dispatch</strong> — Command evaluates Route A (92% safe) vs Route B (blocked), dispatches Volunteer Ravi Kumar.",
    timelinePrefix: "auth",
    timelineStep: 4,
    action: () => {
      const criticalReq = db.requests.find(r => r.priority === "Critical" && r.status === "Submitted");
      if (criticalReq) assignJobToVolunteer(criticalReq.id);
      else if (db.requests[0]) assignJobToVolunteer(db.requests[0].id);
      progressTimeline("auth", 4);
      triggerTourHighlight(
        "authority-vector-map",
        "🗺️ Swarm Route Intelligence",
        "Route A (92% safe) is selected over Route B (flood-blocked). Ravi Kumar is dispatched.",
        "Sending responders into active flood paths risks losing both the rescuer and the victim.",
        "Citizen crowdsourced hazard reports dynamically update route safety coefficients in real time.",
        6
      );
    }
  },
  7: {
    desc: "<strong>Step 7: Resource Alert</strong> — AI calculates water at Shelter A will exhaust in 9.2 hours. Alarm raised.",
    timelinePrefix: "auth",
    timelineStep: 4,
    action: () => {
      db.shelters[0].resources.water = 900;
      updateCrisisForecasting();
      progressTimeline("auth", 4);
      triggerTourHighlight(
        "authority-forecast-panel",
        "📈 Logistics Depletion Forecasting",
        "Shelter A water stock will run dry in 9.2 hours. Critical alert raised before it hits zero.",
        "Safe zones become death traps without water. Early warnings allow proactive stock diversion.",
        "Burn rate formula: Stock ÷ (Occupants × 3L/day) × 24hrs. Flags below 12-hour threshold.",
        7
      );
    }
  },
  8: {
    desc: "<strong>Step 8: Depot Dispatch</strong> — Command deploys emergency water trucks. Shelter A restocked to 95%.",
    timelinePrefix: "auth",
    timelineStep: 5,
    action: () => {
      replenishResources("Puducherry Central Depot");
      progressTimeline("auth", 5);
      triggerTourHighlight(
        "res-water",
        "🚚 Command Depot Allocation",
        "Emergency water trucks are dispatched. Shelter A inventory restores to 95% in minutes.",
        "Resource pre-positioning prevents evacuee crises before they become medical emergencies.",
        "One-click depot dispatch triggers stock reallocation and updates all shelter inventory meters.",
        8
      );
    }
  },
  9: {
    desc: "<strong>Step 9: Mission Complete</strong> — Volunteer Ravi navigates safely, evacuates Ananya, delivers to Shelter B. Mission resolved.",
    timelinePrefix: "volunteer",
    timelineStep: 6,
    action: () => {
      logout();
      document.getElementById("auth-email").value = "volunteer@sentinel.ai";
      login();
      setTimeout(() => {
        const myVol = db.volunteers.find(v => v.id === "vol-1");
        if (myVol && myVol.activeJobId) {
          volunteerStartJob(myVol.activeJobId);
          setTimeout(() => {
            volunteerCompleteJob(myVol.activeJobId);
            progressTimeline("volunteer", 6);
            setTimeout(() => showMissionSuccess(), 1200);
          }, 2000);
        } else {
          progressTimeline("volunteer", 6);
          setTimeout(() => showMissionSuccess(), 800);
        }
        triggerTourHighlight(
          "volunteer-assigned-job",
          "🚒 Ground Responder Dispatch",
          "Ravi navigates via Route A, safely evacuates Ananya, and marks the mission resolved.",
          "Without coordinated dispatch and safe routing, volunteers operate blind in dangerous terrain.",
          "Volunteer HUD shows live route safety, GPS endpoint, and mission status in real time.",
          9
        );
      }, 1000);
    }
  }
};

function updateDemoControllerUI() {
  document.getElementById("demo-step-indicator").innerText = `Step ${currentDemoStep} of ${totalSteps}`;
  document.getElementById("demo-step-desc").innerHTML = scenarioSteps[currentDemoStep].desc;

  const nextBtn = document.getElementById("btn-next-step");
  if (currentDemoStep === totalSteps) {
    nextBtn.innerText = "🔄 Finish & Restart";
  } else {
    nextBtn.innerText = `▶ Execute Step ${currentDemoStep}`;
  }

  const dots = document.querySelectorAll(".demo-progress-dots .dot");
  dots.forEach((dot, idx) => {
    dot.className = "dot";
    const stepNum = idx + 1;
    if (stepNum === currentDemoStep) dot.classList.add("active");
    else if (stepNum < currentDemoStep) dot.classList.add("completed");
  });

  // Dynamically update page padding to avoid overlapping bottom bar
  if (typeof updateDemoPanelHeight === "function") {
    updateDemoPanelHeight();
  }
}

function advanceDemoStep() {
  scenarioSteps[currentDemoStep].action();
  if (currentDemoStep === totalSteps) {
    currentDemoStep = 1;
  } else {
    currentDemoStep++;
  }
  updateDemoControllerUI();
}

function resetDemo() {
  currentDemoStep = 1;

  // Hide mission success
  const overlay = document.getElementById('mission-success-overlay');
  if (overlay) overlay.classList.add('hidden');

  // Reset database
  db.requests = [
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
  ];

  db.volunteers[0] = {
    id: "vol-1",
    name: "Ravi Kumar",
    email: "volunteer@sentinel.ai",
    status: "Active",
    coords: { lat: 11.935, lng: 79.800 },
    activeJobId: "SOS-2940"
  };

  db.shelters[0] = {
    id: "shelter-a",
    name: "Puducherry North School Shelter",
    capacity: 800, current: 780,
    coords: { lat: 11.955, lng: 79.802 },
    resources: { water: 900, food: 1200, medicine: 450, beds: 20 }
  };

  db.shelters[1] = {
    id: "shelter-b",
    name: "Central Sports Community Arena",
    capacity: 1500, current: 550,
    coords: { lat: 11.928, lng: 79.792 },
    resources: { water: 6500, food: 3200, medicine: 900, beds: 950 }
  };

  routesData.RouteA.safety = 92;
  routesData.RouteB.safety = 74;
  db.swarmReports = [
    { id: "sw-1", type: "flood_area", text: "Water logged up to 3 feet on Beach Rd near the lighthouse.", location: "Beach Road", coords: { lat: 11.933, lng: 79.817 } }
  ];

  db.offlineQueue = [];
  toggleNetworkStatus("citizen", true);

  // Reset all timeline nodes to default
  document.querySelectorAll('.t-node').forEach(n => {
    n.classList.remove('active','completed','crisis');
  });
  // Reactivate t0 nodes
  document.querySelectorAll('[id*="node-t0"]').forEach(n => n.classList.add('active'));

  // Close tour
  closeTour();
  logout();
  updateDemoControllerUI();

  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:3000;background:rgba(15,23,42,0.95);color:#93c5fd;padding:12px 28px;border-radius:8px;font-family:var(--font-family-title);font-weight:700;font-size:13px;border:1px solid rgba(59,130,246,0.4);box-shadow:0 0 20px rgba(59,130,246,0.3);animation:slide-in 0.3s ease;';
  alertDiv.textContent = '? Scenario reset to initial state — ready to replay';
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Initial UI load
window.addEventListener("DOMContentLoaded", () => {
  updateDemoControllerUI();
  // Initial agent log entry
  setTimeout(() => pushAgentLog('Core', 'Command systems online. All sensor arrays nominal.', 'green'), 1500);
});

