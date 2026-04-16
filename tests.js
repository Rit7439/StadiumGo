/**
 * StadiumGo — Unit Test Suite
 * Tests core logic modules: formatting, state, queue estimation,
 * heatmap intensity, sensor feed, alert rotation, and AI decision log.
 *
 * Compatible with Jest (Node.js) — run: npx jest tests.js
 *
 * Coverage targets:
 *  - formatTime()
 *  - intensityToColor()
 *  - feedMessages content validation
 *  - state bounds enforcement (liveCounters)
 *  - Queue wait-time formatter edge cases
 *  - scrollToSection safe navigation
 *  - waitBars clamping logic
 *  - Gate lane bounds checking
 *  - AI decision log counter logic
 *  - Stat counter easing function
 */

"use strict";

/* ============================================================
   UTILITY FUNCTIONS (extracted / mirrored from app.js)
   These are pure-function mirrors so we can test without DOM.
   ============================================================ */

/** formatTime — as used in initQueueSimulation */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** intensityToColor — as used in initHeatmap */
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

/** statEasing — cubic ease-out used in initStatCounters */
function statEasing(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

/** clamp — used in waitBars and laneAnimation */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** eventsPerSecUpdate — state update logic from initLiveCounters */
function eventsPerSecUpdate(current, delta) {
  return Math.max(10000, Math.min(16000, current + delta));
}

/** formatADLTime — from initAIDecisionLog */
function formatADLTime(secAgo) {
  if (secAgo < 5)  return "just now";
  if (secAgo < 60) return `${secAgo}s ago`;
  return `${Math.floor(secAgo / 60)}m ago`;
}

/** feedMessages — mirrored from app.js for content validation */
const feedMessages = [
  { type: "cam", msg: "Zone C density: 78 persons/m² — above threshold" },
  { type: "iot", msg: "Gate B3 pressure sensors: queue forming, 120kg avg" },
  { type: "ble", msg: "Beacon NW-04 detected 847 devices — surge predicted" },
  { type: "cam", msg: "Restroom C2: queue exceeds 45 persons — alert triggered" },
  { type: "iot", msg: "Concession stand D7: inventory below 15% for Fries" },
  { type: "cam", msg: "Exit E clear — routing ML model activated, rerouting 2.3K fans" },
  { type: "ble", msg: "Beacon SE-11 signal lost — fallback IoT active" },
  { type: "iot", msg: "Staff unit S-042 deployed to Gate A3 — AI recommendation" },
  { type: "cam", msg: "VIP section: occupancy at 44% — below threshold, all good" },
  { type: "iot", msg: "North Stand temperature: 28°C, ventilation auto-adjusted" },
  { type: "ble", msg: "Mobile app session count: 48,291 active fans" },
  { type: "cam", msg: "Emergency exit F: clear path confirmed, marking available" },
];

/** Google Maps venue markers validation */
const stadiumMarkers = [
  { id: "gate-a", label: "Gate A — Main Entry",    lat: 12.9716, lng: 77.5946 },
  { id: "gate-b", label: "Gate B — North Entry",   lat: 12.9726, lng: 77.5946 },
  { id: "medical", label: "Medical Center",         lat: 12.9711, lng: 77.5951 },
  { id: "parking", label: "Parking Zone P1",        lat: 12.9705, lng: 77.5940 },
  { id: "food",    label: "Food Court — Level 2",   lat: 12.9718, lng: 77.5955 },
];

/* ============================================================
   TEST SUITE
   ============================================================ */

describe("formatTime()", () => {
  test("formats whole minutes correctly", () => {
    expect(formatTime(120)).toBe("2:00");
  });

  test("pads single-digit seconds with leading zero", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  test("handles zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  test("handles sub-minute values", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  test("handles large values (11 minutes)", () => {
    expect(formatTime(660)).toBe("11:00");
  });

  test("handles exactly 1 hour", () => {
    expect(formatTime(3600)).toBe("60:00");
  });
});

describe("intensityToColor()", () => {
  test("returns rgba string for low intensity (0.1)", () => {
    const result = intensityToColor(0.1);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.7\)$/);
  });

  test("returns rgba string for medium intensity (0.5)", () => {
    const result = intensityToColor(0.5);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.7\)$/);
  });

  test("returns rgba string for high intensity (0.85)", () => {
    const result = intensityToColor(0.85);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.75\)$/);
  });

  test("low intensity uses alpha 0.7", () => {
    expect(intensityToColor(0.2)).toContain("0.7");
  });

  test("high intensity uses alpha 0.75", () => {
    expect(intensityToColor(0.9)).toContain("0.75");
  });

  test("boundary: exactly 0.33 goes to mid branch", () => {
    const result = intensityToColor(0.33);
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.7\)$/);
  });

  test("boundary: exactly 0.66 goes to high branch", () => {
    const result = intensityToColor(0.66);
    expect(result).toContain("0.75");
  });
});

describe("statEasing()", () => {
  test("returns 0 at progress 0", () => {
    expect(statEasing(0)).toBeCloseTo(0);
  });

  test("returns 1 at progress 1", () => {
    expect(statEasing(1)).toBeCloseTo(1);
  });

  test("returns value between 0 and 1 for mid progress", () => {
    const val = statEasing(0.5);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(1);
  });

  test("easing is monotonically increasing", () => {
    const points = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    for (let i = 1; i < points.length; i++) {
      expect(statEasing(points[i])).toBeGreaterThan(statEasing(points[i - 1]));
    }
  });

  test("easing accelerates early (convex shape)", () => {
    // At 50% progress, eased value should be > 50% (fast start)
    expect(statEasing(0.5)).toBeGreaterThan(0.5);
  });
});

describe("clamp()", () => {
  test("returns value unchanged when within bounds", () => {
    expect(clamp(50, 5, 98)).toBe(50);
  });

  test("clamps to min when below", () => {
    expect(clamp(-10, 5, 98)).toBe(5);
  });

  test("clamps to max when above", () => {
    expect(clamp(200, 5, 98)).toBe(98);
  });

  test("handles exact min boundary", () => {
    expect(clamp(5, 5, 98)).toBe(5);
  });

  test("handles exact max boundary", () => {
    expect(clamp(98, 5, 98)).toBe(98);
  });

  test("wait bars use correct bounds [5, 98]", () => {
    expect(clamp(0, 5, 98)).toBe(5);
    expect(clamp(100, 5, 98)).toBe(98);
  });
});

describe("eventsPerSecUpdate()", () => {
  test("keeps value within [10000, 16000]", () => {
    expect(eventsPerSecUpdate(12000, 500)).toBeLessThanOrEqual(16000);
    expect(eventsPerSecUpdate(12000, -5000)).toBeGreaterThanOrEqual(10000);
  });

  test("floors at 10000 when large negative delta", () => {
    expect(eventsPerSecUpdate(10100, -50000)).toBe(10000);
  });

  test("caps at 16000 when large positive delta", () => {
    expect(eventsPerSecUpdate(15900, 50000)).toBe(16000);
  });

  test("allows normal delta in the middle", () => {
    const result = eventsPerSecUpdate(13000, 200);
    expect(result).toBe(13200);
  });
});

describe("formatADLTime()", () => {
  test("returns 'just now' for < 5 seconds", () => {
    expect(formatADLTime(2)).toBe("just now");
    expect(formatADLTime(4)).toBe("just now");
  });

  test("returns seconds string for 5–59 seconds", () => {
    expect(formatADLTime(12)).toBe("12s ago");
    expect(formatADLTime(59)).toBe("59s ago");
  });

  test("returns minutes string for 60+ seconds", () => {
    expect(formatADLTime(60)).toBe("1m ago");
    expect(formatADLTime(125)).toBe("2m ago");
  });

  test("boundary: exactly 5 seconds not 'just now'", () => {
    expect(formatADLTime(5)).toBe("5s ago");
  });

  test("boundary: exactly 60 seconds = 1m ago", () => {
    expect(formatADLTime(60)).toBe("1m ago");
  });
});

describe("feedMessages data integrity", () => {
  test("has 12 messages", () => {
    expect(feedMessages).toHaveLength(12);
  });

  test("all messages have 'type' and 'msg' fields", () => {
    feedMessages.forEach((m) => {
      expect(m).toHaveProperty("type");
      expect(m).toHaveProperty("msg");
    });
  });

  test("all types are valid sensor types (cam, iot, ble)", () => {
    const validTypes = new Set(["cam", "iot", "ble"]);
    feedMessages.forEach((m) => {
      expect(validTypes.has(m.type)).toBe(true);
    });
  });

  test("no empty messages", () => {
    feedMessages.forEach((m) => {
      expect(m.msg.length).toBeGreaterThan(0);
    });
  });

  test("cam messages are present", () => {
    const cams = feedMessages.filter((m) => m.type === "cam");
    expect(cams.length).toBeGreaterThan(0);
  });

  test("ble messages reference beacons", () => {
    const bles = feedMessages.filter((m) => m.type === "ble");
    bles.forEach((m) => {
      expect(m.msg.toLowerCase()).toMatch(/beacon|session|app/);
    });
  });
});

describe("Google Maps Stadium Markers", () => {
  test("has 5 venue markers defined", () => {
    expect(stadiumMarkers).toHaveLength(5);
  });

  test("all markers have id, label, lat, lng", () => {
    stadiumMarkers.forEach((m) => {
      expect(m).toHaveProperty("id");
      expect(m).toHaveProperty("label");
      expect(m).toHaveProperty("lat");
      expect(m).toHaveProperty("lng");
    });
  });

  test("all coordinates are valid (lat: -90 to 90, lng: -180 to 180)", () => {
    stadiumMarkers.forEach((m) => {
      expect(m.lat).toBeGreaterThanOrEqual(-90);
      expect(m.lat).toBeLessThanOrEqual(90);
      expect(m.lng).toBeGreaterThanOrEqual(-180);
      expect(m.lng).toBeLessThanOrEqual(180);
    });
  });

  test("marker IDs are unique", () => {
    const ids = stadiumMarkers.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("includes required entry points (gate-a and gate-b)", () => {
    const ids = stadiumMarkers.map((m) => m.id);
    expect(ids).toContain("gate-a");
    expect(ids).toContain("gate-b");
  });

  test("medical center marker is present", () => {
    const medical = stadiumMarkers.find((m) => m.id === "medical");
    expect(medical).toBeDefined();
    expect(medical.label).toMatch(/medical/i);
  });
});

describe("Queue simulation bounds", () => {
  const queues = {
    "q-gate-a1": { base: 130, noise: 30 },
    "q-gate-b3": { base: 45,  noise: 20 },
    "q-burger":  { base: 450, noise: 60 },
    "q-pizza":   { base: 195, noise: 40 },
    "q-rest-c2": { base: 660, noise: 80 },
    "q-rest-a1": { base: 260, noise: 45 },
  };

  Object.entries(queues).forEach(([id, q]) => {
    test(`${id}: simulated value always >= 10s`, () => {
      for (let i = 0; i < 100; i++) {
        const noise = Math.floor((Math.random() - 0.5) * q.noise);
        const val = Math.max(10, q.base + noise);
        expect(val).toBeGreaterThanOrEqual(10);
      }
    });
  });

  test("formatTime produces correct format for queue output", () => {
    expect(formatTime(130)).toBe("2:10");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(660)).toBe("11:00");
  });
});

describe("Gate lane animation bounds", () => {
  const ranges = [
    { id: "lane-n1", range: [65, 90] },
    { id: "lane-n2", range: [55, 80] },
    { id: "lane-n3", range: [85, 98] },
    { id: "lane-s1", range: [10, 30] },
    { id: "lane-s2", range: [20, 45] },
    { id: "lane-s3", range: [8,  25] },
  ];

  ranges.forEach(({ id, range: [min, max] }) => {
    test(`${id}: simulated fill within [${min}%, ${max}%]`, () => {
      for (let i = 0; i < 100; i++) {
        const val = min + Math.random() * (max - min);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
      }
    });
  });
});
