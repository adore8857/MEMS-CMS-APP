#!/usr/bin/env python3
"""Bridge UDP datagrams to the browser over WebSocket.

Browsers cannot open raw UDP sockets. Run this helper on the machine that can
reach the device, then choose UDP in the web app and connect to the bridge.

Example:
  python scripts/udp_ws_bridge.py ^
    --local-host 0.0.0.0 ^
    --local-port 4000 ^
    --remote-host 192.168.1.252 ^
    --remote-port 1030 ^
    --ws-host 127.0.0.1 ^
    --ws-port 8765

Install dependency:
  pip install websockets
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

try:
    from websockets.legacy.server import WebSocketServerProtocol, serve
except ImportError as exc:  # pragma: no cover
    try:
        from websockets import WebSocketServerProtocol, serve
    except ImportError:
        raise SystemExit("Missing dependency: websockets\nInstall with: pip install websockets") from exc


@dataclass
class BridgeConfig:
    local_host: str
    local_port: int
    remote_host: str
    remote_port: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Forward UDP datagrams to a browser WebSocket client.")
    parser.add_argument("--ws-host", default="127.0.0.1", help="WebSocket bridge host")
    parser.add_argument("--ws-port", type=int, default=8765, help="WebSocket bridge port")
    parser.add_argument("--local-host", default="0.0.0.0", help="UDP local bind host")
    parser.add_argument("--local-port", type=int, default=4000, help="UDP local bind port")
    parser.add_argument("--remote-host", default="192.168.1.252", help="UDP remote host for outgoing messages")
    parser.add_argument("--remote-port", type=int, default=1030, help="UDP remote port for outgoing messages")
    return parser.parse_args()


def config_from_path(path: str, defaults: argparse.Namespace) -> BridgeConfig:
    query = parse_qs(urlparse(path).query)

    def value(name: str, default: str) -> str:
        return query.get(name, [default])[0] or default

    return BridgeConfig(
        local_host=value("localHost", defaults.local_host),
        local_port=int(value("localPort", str(defaults.local_port))),
        remote_host=value("remoteHost", defaults.remote_host),
        remote_port=int(value("remotePort", str(defaults.remote_port))),
    )


class UdpBridgeProtocol(asyncio.DatagramProtocol):
    def __init__(self, websocket: WebSocketServerProtocol):
        self.websocket = websocket
        self.transport: asyncio.DatagramTransport | None = None

    def connection_made(self, transport: asyncio.BaseTransport) -> None:
        self.transport = transport  # type: ignore[assignment]

    def datagram_received(self, data: bytes, addr: tuple[str, int]) -> None:
        asyncio.create_task(self.websocket.send(data))
        print(f"[udp] rx {len(data)} bytes from {addr[0]}:{addr[1]}")

    def error_received(self, exc: Exception) -> None:
        print(f"[udp] socket error: {exc}")


async def handle_client(websocket: WebSocketServerProtocol, path: str, defaults: argparse.Namespace) -> None:
    cfg = config_from_path(path, defaults)
    loop = asyncio.get_running_loop()
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: UdpBridgeProtocol(websocket),
        local_addr=(cfg.local_host, cfg.local_port),
    )

    remote = (cfg.remote_host, cfg.remote_port)
    print(
        f"[bridge] client connected, udp local={cfg.local_host}:{cfg.local_port}, "
        f"remote={cfg.remote_host}:{cfg.remote_port}"
    )

    try:
        async for message in websocket:
            payload = message.encode("utf-8") if isinstance(message, str) else bytes(message)
            transport.sendto(payload, remote)
            print(f"[udp] tx {len(payload)} bytes to {remote[0]}:{remote[1]}")
    finally:
        transport.close()
        print("[bridge] client disconnected")


async def main_async() -> None:
    args = parse_args()

    async def handler(websocket: WebSocketServerProtocol, path: str) -> None:
        await handle_client(websocket, path, args)

    print(f"[bridge] websocket listening on ws://{args.ws_host}:{args.ws_port}")
    async with serve(handler, args.ws_host, args.ws_port, max_size=None):
        await asyncio.Future()


def main() -> int:
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        print("\n[bridge] stopped by user")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
