const socket = new WebSocket(`ws://${location.host}`);
socket.onopen = () => {
    socket.send(JSON.stringify({ token: "local-lan-secret-123" }));
    console.log("Connected ✅");
};

let lastX = null,
    lastY = null;
let touchStartTime = 0;
let twoFinger = false;

document.addEventListener("touchstart", (e) => {
    e.preventDefault();

    if (e.touches.length === 1) {
        const t = e.touches[0];
        lastX = t.clientX;
        lastY = t.clientY;
        touchStartTime = Date.now();
        twoFinger = false;
    } else if (e.touches.length === 2) {
        // Instant two-finger right click
        twoFinger = true;
        socket.send(JSON.stringify({ type: "click", event: "right" }));
    }
});

document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;

    const t = e.touches[0];
    const dxRaw = (t.clientX - lastX) / window.innerWidth;
    const dyRaw = (t.clientY - lastY) / window.innerHeight;

    // Magnitude of movement
    const dist = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);

    // --- Dynamic sensitivity ---
    // smaller movement => small multiplier
    // bigger swipe => large multiplier (accelerated)
    let multiplier;
    if (dist < 0.002) multiplier = 0.3;         // tiny precise moves (matches libinput min)
    else if (dist < 0.03) multiplier = 1.0;     // small moves (neutral, standard mapping)
    else if (dist < 0.06) multiplier = 2.0;     // medium swipes (within OS max scaling)
    else multiplier = 3.0;                      // large gestures (matches upper end of macOS/libinput)


    const dx = dxRaw * multiplier;
    const dy = dyRaw * multiplier;

    lastX = t.clientX;
    lastY = t.clientY;

    socket.send(JSON.stringify({ type: 'move', dx, dy }));
    e.preventDefault();
});


document.addEventListener("touchend", (e) => {
    e.preventDefault();
    const now = Date.now();

    // Quick tap = left click
    if (!twoFinger && now - touchStartTime < 200) {
        socket.send(JSON.stringify({ type: "click", event: "left" }));
    }

    lastX = null;
    lastY = null;
});
