import struct
import zlib
from pathlib import Path


def write_png(path: Path, size: int) -> None:
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y, size))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def pixel(x: int, y: int, size: int) -> tuple[int, int, int, int]:
    nx = (x + 0.5) / size
    ny = (y + 0.5) / size
    background = (109, 40, 217, 255)
    foreground = (255, 255, 255, 255)

    def ellipse(cx: float, cy: float, rx: float, ry: float) -> bool:
        return ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2 <= 1

    def circle(cx: float, cy: float, radius: float) -> bool:
        return (nx - cx) ** 2 + (ny - cy) ** 2 <= radius * radius

    if ellipse(0.50, 0.62, 0.16, 0.13):
        return foreground
    for cx, cy, radius in ((0.30, 0.40, 0.07), (0.42, 0.32, 0.075), (0.58, 0.32, 0.075), (0.70, 0.40, 0.07)):
        if circle(cx, cy, radius):
            return foreground
    return background


if __name__ == "__main__":
    public = Path(__file__).resolve().parents[1] / "public"
    public.mkdir(parents=True, exist_ok=True)
    write_png(public / "icon-192.png", 192)
    write_png(public / "icon-512.png", 512)
