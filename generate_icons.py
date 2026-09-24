import os
import struct
import zlib
from pathlib import Path

os.makedirs('public', exist_ok=True)

def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

for size in (192, 512):
    pixel_data = bytearray()
    for y in range(size):
        for x in range(size):
            if 20 <= x < size - 20 and 20 <= y < size - 20:
                px = (0, 118, 110, 255)
            else:
                px = (255, 255, 255, 255)
            pixel_data.extend(px)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(pixel_data), level=9))
    png += chunk(b'IEND', b'')
    Path(f'public/icon-{size}.png').write_bytes(png)
