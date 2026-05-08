# Web Serial Studio Smart Bearing

Web Serial Studio Smart Bearing is a browser-based telemetry dashboard for viewing and debugging device data in real time. It runs as a static web app and supports Serial, WebSocket, and MQTT connections, with multiple visualization widgets and STM32 binary frame parsing.

## Highlights

- Real-time dashboards with plots, gauges, bars, tables, and other widgets
- Multiple transport layers: `Serial`, `WebSocket`, `MQTT`
- UDP device streams through a local WebSocket bridge
- STM32 binary payload parsing and quick plotting modes
- Project-style configuration workflow in the browser
- No backend required for deployment

## Tech Stack

- Vanilla JavaScript with ES modules
- Static HTML/CSS frontend
- Chart.js for plotting
- MQTT.js for browser MQTT over WebSocket
- GitHub Pages compatible deployment

## Run Locally

Because the app uses ES modules, it must be served through HTTP instead of opening `index.html` with `file://`.

```bash
cd web-serial-studio-smart-bearing
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

This repository already includes the GitHub Pages workflow file `/.github/workflows/deploy.yml`, so the project can be published directly from GitHub without a build step.

### 1. Push the repository to GitHub

```bash
git init
git remote add origin <your-repo-url>
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

If the repository already exists locally, just set `origin` and push your current branch.

### 2. Enable GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. In `Build and deployment`, set `Source` to `GitHub Actions`.
4. Save the setting.

### 3. Wait for the workflow to finish

Every push to `main` triggers the deployment workflow automatically. After the action succeeds, the site will be available at:

```text
https://<your-github-username>.github.io/<your-repository-name>/
```

## Browser Requirements

- `Serial` mode requires a browser with Web Serial API support, such as recent Chrome or Edge
- `MQTT` in the browser requires a `ws://` or `wss://` broker endpoint
- `UDP` requires the local bridge script because browsers cannot open raw UDP sockets
- `GitHub Pages` is HTTPS-hosted, so browser APIs that require secure context will work there
- `WebSocket` endpoints should usually use `wss://` when the site is served over HTTPS

## UDP Bridge

Install the bridge dependency:

```bash
pip install websockets
```

Start the bridge before choosing `UDP` in the web app:

```bash
python scripts/udp_ws_bridge.py --local-port 4000 --remote-host 192.168.1.252 --remote-port 1030
```

The web app connects to `ws://localhost:8765`, while the bridge listens for UDP on the configured local port and forwards datagrams to the dashboard.

## Notes for GitHub Publishing

- This is a static site, so no Node.js build pipeline is required
- All asset paths in `index.html` are relative, which makes the app suitable for repository-based GitHub Pages hosting
- The default workflow publishes the repository root as the site artifact

## Project Structure

```text
.
|-- index.html
|-- src/
|   |-- core/
|   |-- io/
|   |-- ui/
|   |-- widgets/
|   `-- styles/
`-- .github/workflows/deploy.yml
```

## Recommended Repository Description

If you want the GitHub repository page to look more complete, you can use this short description:

```text
Browser-based telemetry dashboard with Serial, WebSocket, MQTT, and STM32 binary parsing support.
```
