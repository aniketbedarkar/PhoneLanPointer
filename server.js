const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const robot = require("robotjs");

const APP_PORT = 3000;
const AUTH_TOKEN = "local-lan-secret-123";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

app.get("/status", (_, res) => res.send("OK"));

wss.on("connection", (ws) => {
    console.log("📱 Client connected");

    let authorized = false;
    let lastMoveTime = 0;
    const MOVE_INTERVAL = 10; // faster + smoother updates

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

server.listen(APP_PORT, () => {
    console.log(`🖥️  Server running at http://0.0.0.0:${APP_PORT}`);
    console.log(`📲 Open on phone: http://<laptop-ip>:${APP_PORT}`);
});
