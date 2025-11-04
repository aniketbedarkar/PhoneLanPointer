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
    const shorterSide = Math.min(window.innerWidth, window.innerHeight);
    const dxRaw = (t.clientX - lastX) / shorterSide;
    const dyRaw = (t.clientY - lastY) / shorterSide;

    const dist = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);

    // Smooth exponential acceleration
    const baseSensitivity = 1.3;
    const accelerationFactor = 5.0;
    let multiplier = 1 + accelerationFactor * Math.pow(dist, baseSensitivity);
    if (multiplier > 4.5) multiplier = 4.5;

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
