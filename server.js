const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const robot = require("robotjs");
const QRCode = require("qrcode");
const os = require("os");

const APP_PORT = 3000;
const AUTH_TOKEN = "local-lan-secret-123";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));
app.get("/status", (_, res) => res.send("OK"));

// Utility: get LAN IP
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === "IPv4" && !net.internal) return net.address;
        }
    }
    return "localhost";
}

// WebSocket logic
wss.on("connection", (ws) => {
    console.log("📱 Client connected");

    let authorized = false;
    let lastMoveTime = 0;
    const MOVE_INTERVAL = 10;

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());

            // --- AUTH ---
            if (!authorized) {
                if (msg.token === AUTH_TOKEN) {
                    authorized = true;
                    ws.send(JSON.stringify({ ok: true, msg: "authorized" }));
                    console.log("✅ Client authorized");
                } else {
                    ws.send(JSON.stringify({ ok: false, error: "invalid token" }));
                    ws.close();
                }
                return;
            }

            // --- MOVE ---
            if (msg.type === "move") {
                const now = Date.now();
                if (now - lastMoveTime < MOVE_INTERVAL) return;
                lastMoveTime = now;

                const screen = robot.getScreenSize();
                const dx = msg.dx * screen.width;
                const dy = msg.dy * screen.height;
                const mouse = robot.getMousePos();
                robot.moveMouse(mouse.x + dx, mouse.y + dy);
            }

            // --- CLICK ---
            else if (msg.type === "click") {
                if (msg.event === "left") robot.mouseClick("left");
                else if (msg.event === "right") robot.mouseClick("right");
            }

            // --- SCROLL (optional later) ---
            else if (msg.type === "scroll") {
                robot.scrollMouse(msg.sx * 100, msg.sy * 100);
            }
        } catch (e) {
            console.error("⚠️ Bad message", e);
        }
    });

    ws.on("close", () => console.log("❌ Client disconnected"));
});

server.listen(APP_PORT, async () => {
    const ip = getLocalIP();
    const url = `http://${ip}:${APP_PORT}`;
    console.log(`🖥️  Server running at ${url}`);

    // Generate QR in terminal
    console.log("\n📲 Scan this QR code from your phone to open the trackpad page:\n");
    const qr = await QRCode.toString(url, { type: "terminal", small: true });
    console.log(qr);

    console.log(`Or open manually: ${url}\n`);
});
