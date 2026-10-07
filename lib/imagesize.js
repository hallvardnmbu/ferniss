// Read image dimensions straight from file headers (no dependencies), so the
// browser can reserve space before images load. Returns null when unknown.

function jpegSize(buf) {
  let offset = 2;
  let orientation = 1;
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xff) { offset++; continue; }
    const marker = buf[offset + 1];
    if (marker === 0xff) { offset++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buf.readUInt16BE(offset + 2);
    if (marker === 0xe1 && buf.toString("ascii", offset + 4, offset + 8) === "Exif") {
      orientation = exifOrientation(buf, offset + 10) ?? 1;
    }
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      // Phones store portrait photos sideways and flag them via EXIF.
      return orientation >= 5 ? { width: height, height: width } : { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

function exifOrientation(buf, tiff) {
  const little = buf.toString("ascii", tiff, tiff + 2) === "II";
  const u16 = (at) => (little ? buf.readUInt16LE(at) : buf.readUInt16BE(at));
  const u32 = (at) => (little ? buf.readUInt32LE(at) : buf.readUInt32BE(at));
  const ifd = tiff + u32(tiff + 4);
  const entries = u16(ifd);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return null;
}

function webpSize(buf) {
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  return null;
}

function svgSize(buf) {
  const head = buf.toString("utf8", 0, 2000);
  const viewBox = head.match(/viewBox=["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (viewBox) return { width: Math.round(+viewBox[1]), height: Math.round(+viewBox[2]) };
  const width = head.match(/<svg[^>]*\swidth=["']([\d.]+)/);
  const height = head.match(/<svg[^>]*\sheight=["']([\d.]+)/);
  return width && height ? { width: Math.round(+width[1]), height: Math.round(+height[1]) } : null;
}

export function imageSize(buf, ext) {
  try {
    switch (ext) {
      case ".png": return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
      case ".gif": return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
      case ".jpg": case ".jpeg": return jpegSize(buf);
      case ".webp": return webpSize(buf);
      case ".svg": return svgSize(buf);
    }
  } catch {}
  return null;
}
