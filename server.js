const express = require("express");
const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const robot = require("robotjs");
const QRCode = require("qrcode");
const os = require("os");

const APP_PORT = 3000;
const AUTH_TOKEN = "local-lan-secret-123";

const app = express();
app.use(express.static("public"));

// Create HTTPS server
const server = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
}, app);

const wss = new WebSocket.Server({ server });

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

    let mouse = robot.getMousePos();
    let mx = mouse.x;
    let my = mouse.y;

    // Store previous orientation
    let prevAlpha = 0;
    let prevBeta = 0;
    let prevGamma = 0;



    const screen = robot.getScreenSize();
    const SCREEN_WIDTH = screen.width;
    const SCREEN_HEIGHT = screen.height;

    const SENSITIVITY_ALPHA = 45; // horizontal movement
    const SENSITIVITY_BETA = 30;  // vertical movement

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.type === "move") {
                const alpha = parseFloat(data.a.toFixed(1));
                const beta = parseFloat(data.b.toFixed(1));
                const gamma = parseFloat(data.g.toFixed(1));

                // Calculate deltas
                // Calculate delta with circular wrapping
                function deltaAngle(current, previous) {
                    let delta = current - previous;
                    // Normalize to [-180, 180]
                    if (delta > 180) delta -= 360;
                    if (delta < -180) delta += 360;
                    return delta;
                }

                const deltaAlpha = deltaAngle(alpha, prevAlpha);
                const deltaBeta = beta - prevBeta;

                // Update mouse position relative to previous
                mx -= deltaAlpha * SENSITIVITY_ALPHA;
                my -= deltaBeta * SENSITIVITY_BETA;

                // Clamp to screen bounds
                mx = Math.max(0, Math.min(SCREEN_WIDTH, mx));
                my = Math.max(0, Math.min(SCREEN_HEIGHT, my));

                // Move mouse
                robot.moveMouse(Math.floor(mx), Math.floor(my));

                // // Continuous server console output
                // process.stdout.write(
                //     `\rα: ${alpha} | β: ${beta} | γ: ${gamma} | x:${Math.floor(mx)} y:${Math.floor(my)}`
                // );

                // Store current orientation for next delta calculation
                prevAlpha = alpha;
                prevBeta = beta;
                prevGamma = gamma;
            } else if (data.type === "click") {
                robot.mouseClick(data.button || "left");
            }
        } catch (err) {
            console.error("Invalid message:", err);
        }
    });

    ws.on("close", () => console.log("❌ Client disconnected"));
});


server.listen(APP_PORT, async () => {
    const ip = getLocalIP();
    const url = `https://${ip}:${APP_PORT}`;
    console.log(`🖥️  Server running at ${url}`);

    // Generate QR in terminal
    console.log("\n📲 Scan this QR code from your phone to open the trackpad page:\n");
    const qr = await QRCode.toString(url, { type: "terminal", small: true });
    console.log(qr);

    console.log(`Or open manually: ${url}\n`);
});
