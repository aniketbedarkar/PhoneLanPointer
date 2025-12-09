const socket = new WebSocket("wss://" + window.location.hostname + ":3000");

let motionReady = false;
let calibrated = false;

let lastSend = 0;
const sendInterval = 20; // ms

// ===== TOAST UTILITY =====
function showToast(message, duration = 3000) {
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "50px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(0,0,0,0.8)";
    toast.style.color = "white";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "40px";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s, bottom 0.5s";
    document.body.appendChild(toast);

    // Show
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.bottom = "70px";
    });

    // Hide after duration
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.bottom = "50px";
        setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
}

// Ask for motion permission (iOS 13+)
async function requestMotionPermission() {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            if (res === "granted") return true;
            showToast("❌ Motion permission denied. Enable it in Settings → Motion & Orientation Access");
            return false;
        } catch {
            showToast("⚠️ Cannot request motion permission.");
            return false;
        }
    }
    return true;
}
// Start listening to orientation events
function startAirMouse() {
    window.addEventListener("deviceorientation", (event) => {
        if (!calibrated) return;

        const now = Date.now();
        if (now - lastSend < sendInterval) return;

        const alpha = event.alpha || 0;
        const beta = event.beta || 0;
        const gamma = event.gamma || 0;

        // Send absolute position
        socket.send(JSON.stringify({
            type: "move",
            a: alpha,
            b: beta,
            g: gamma
        }));

        lastSend = now;
    });

    // Tap for left click
    document.addEventListener("touchend", () => {
        if (calibrated) {
            socket.send(JSON.stringify({ type: "click", button: "left" }));
        }
    });
}

// Calibrate neutral orientation
async function initAirMouse() {
    if (!motionReady) {
        const ok = await requestMotionPermission();
        if (!ok) return;
        showToast("📏 Hold phone level and tap to calibrate.");
        motionReady = true;
        return;
    }

    if (!calibrated) {
        window.addEventListener("deviceorientation", (e) => {
            neutral = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };
            calibrated = true;
            showToast("✅ Calibrated! Point your phone to move the cursor.");
            startAirMouse();
        }, { once: true });
    }
}

// Start calibration on first tap
document.body.addEventListener("click", initAirMouse);
