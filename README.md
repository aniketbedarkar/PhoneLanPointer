# LAN Mouse Controller

Control your computer's mouse over LAN using your phone — either as a touch-based trackpad or an Air Mouse using phone tilt. Works in your local network without installing extra software on the phone.

This repo has **two main modes** in separate branches:

- **`main`** – Touchscreen Trackpad Mode  
- **`airMouse2.0`** – Air Mouse Mode (gyroscope/tilt-based)

---

## Features

### Touchscreen Trackpad (`main` branch)
- Single-finger drag = mouse movement  
- Single tap = left click  
- Two-finger tap = right click  
- Smooth, accelerated movement based on finger drag distance  
- Works on any modern mobile browser  
- QR code generation for easy connection

### Air Mouse (`airMouse2.0` branch)
- Move cursor by tilting phone (uses device orientation: alpha, beta, gamma)  
- Single tap = left click  
- Calibration to hold neutral orientation  
- Smooth mouse movement without jumps when angles wrap around  
- Real-time display of orientation values in server console

---

## Requirements

- Node.js >= 18  
- NPM (comes with Node.js)  
- Modern mobile browser (Chrome, Safari, etc.)  
- Local network access between computer and phone  

Optional for `airMouse2.0`: iOS 13+ requires motion/orientation permission

---

## Installation

```bash
git clone <your-repo-url>
cd touch-mouse-lan
npm install
```
## Switch Branch

Switch to the branch you want:

```bash
git checkout main        # Touchscreen trackpad
git checkout airMouse2.0 # Air mouse
```

## Usage

Start the server:
```
npm start
```

For Touchscreen Trackpad (main), open the QR code URL on your phone.

For Air Mouse (airMouse2.0), open the QR code URL on your phone, allow motion access, and calibrate.

### Touchscreen controls

| Action             | Mouse Effect     |
|-------------------|----------------|
| Single finger drag | Move cursor     |
| Single tap         | Left click      |
| Two-finger tap     | Right click     |

### Air Mouse controls

| Action       | Mouse Effect                   |
|-------------|--------------------------------|
| Tilt phone  | Move cursor                    |
| Tap once    | Left click                     |
| Calibration | Hold phone level and tap       |

## Configuration

- `server.js`: Change `APP_PORT` or `AUTH_TOKEN` if needed  
- `public/script.js`: Adjust sensitivity or acceleration for finer movement  
- `airMouse2.0` branch: Adjust `SENSITIVITY_ALPHA` & `SENSITIVITY_BETA` for mouse tilt responsiveness

## Notes

- Ensure both devices are on the same LAN  
- For `airMouse2.0`, cursor smoothness is improved using delta angles and clamping  
- Works best on wide screens, adjust sensitivity constants as needed

