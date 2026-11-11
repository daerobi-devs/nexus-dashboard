import jsQR from 'jsqr';
import QRCode from 'qrcode';

export interface QrisMerchantInfo {
  merchantName: string;
  merchantCity: string;
  acquirer: string;
  isValidQris: boolean;
}

/**
 * CRC-16/CCITT-FALSE calculation per EMVCo QRIS Specification
 * Polynomial: 0x1021, Initial Value: 0xFFFF
 */
export function computeCrc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Parse top-level EMVCo TLV (Tag-Length-Value) nodes
 */
export function parseEmvTlv(rawQris: string): { tag: string; val: string }[] {
  const clean = (rawQris || '').trim();
  const nodes: { tag: string; val: string }[] = [];
  let i = 0;
  while (i + 4 <= clean.length) {
    const tag = clean.slice(i, i + 2);
    const lenStr = clean.slice(i + 2, i + 4);
    const len = parseInt(lenStr, 10);
    if (Number.isNaN(len) || len < 0 || i + 4 + len > clean.length) {
      break;
    }
    const val = clean.slice(i + 4, i + 4 + len);
    if (tag === '63') {
      break;
    }
    nodes.push({ tag, val });
    i += 4 + len;
  }
  return nodes;
}

/**
 * Extract Merchant Name (Tag 59), City (Tag 60) & Acquirer (GoPay / Dana / BCA / etc.)
 */
export function parseQrisInfo(rawQris: string): QrisMerchantInfo {
  if (!rawQris || !rawQris.trim().startsWith('000201')) {
    return {
      merchantName: 'BUATIN — Tech & Website Creation',
      merchantCity: 'Tangerang Selatan',
      acquirer: 'QRIS GoPay / All Payment',
      isValidQris: false,
    };
  }

  const nodes = parseEmvTlv(rawQris);
  const nameNode = nodes.find((n) => n.tag === '59');
  const cityNode = nodes.find((n) => n.tag === '60');

  let acquirer = 'QRIS Nasional (GoPay / All E-Wallet & Bank)';
  const rawUpper = rawQris.toUpperCase();
  if (rawUpper.includes('GOPAY') || rawUpper.includes('GOJEK')) {
    acquirer = 'GoPay Merchant (QRIS)';
  } else if (rawUpper.includes('DANA')) {
    acquirer = 'DANA Bisnis (QRIS)';
  } else if (rawUpper.includes('BCA')) {
    acquirer = 'BCA QRIS';
  } else if (rawUpper.includes('BRI')) {
    acquirer = 'BRI QRIS';
  } else if (rawUpper.includes('MANDIRI')) {
    acquirer = 'Livin Mandiri QRIS';
  } else if (rawUpper.includes('SHOPEE')) {
    acquirer = 'ShopeePay Merchant (QRIS)';
  }

  return {
    merchantName: nameNode?.val || 'BUATIN MERCHANT',
    merchantCity: cityNode?.val || 'INDONESIA',
    acquirer,
    isValidQris: nodes.length > 3,
  };
}

/**
 * Convert Static QRIS (010211) into Dynamic QRIS (010212) with locked Rupiah amount (Tag 54)
 * and recalculated CRC-16/CCITT-FALSE checksum (Tag 6304).
 */
export function generateDynamicQrisPayload(staticQris: string, amountIDR: number): string {
  const clean = (staticQris || '').trim();
  if (!clean.startsWith('000201')) {
    throw new Error('Kode QRIS Statis tidak valid (wajib diawali 000201).');
  }

  const nodes = parseEmvTlv(clean);
  if (nodes.length < 4) {
    throw new Error('Struktur TLV QRIS tidak lengkap.');
  }

  const amountInt = Math.max(0, Math.round(Number(amountIDR) || 0));
  const amountStr = String(amountInt);

  const rebuiltNodes: { tag: string; val: string }[] = [];
  let amountInserted = false;

  for (const node of nodes) {
    if (node.tag === '01') {
      // Change 11 (Static) -> 12 (Dynamic) if amount > 0
      rebuiltNodes.push({
        tag: '01',
        val: amountInt > 0 ? '12' : '11',
      });
      continue;
    }

    if (node.tag === '54') {
      // Skip existing transaction amount tag so we can insert the fresh amount
      continue;
    }

    // Insert Tag 54 right before Tag 58 (Country Code ID) or Tag 59 (Merchant Name)
    if (!amountInserted && amountInt > 0 && (node.tag === '58' || node.tag === '59')) {
      rebuiltNodes.push({
        tag: '54',
        val: amountStr,
      });
      amountInserted = true;
    }

    rebuiltNodes.push(node);

    // Or right after Tag 53 (Transaction Currency 360)
    if (!amountInserted && amountInt > 0 && node.tag === '53') {
      rebuiltNodes.push({
        tag: '54',
        val: amountStr,
      });
      amountInserted = true;
    }
  }

  if (!amountInserted && amountInt > 0) {
    rebuiltNodes.push({ tag: '54', val: amountStr });
  }

  const bodyWithoutCrc =
    rebuiltNodes
      .map((n) => `${n.tag}${String(n.val.length).padStart(2, '0')}${n.val}`)
      .join('') + '6304';

  const crcHex = computeCrc16Ccitt(bodyWithoutCrc);
  return `${bodyWithoutCrc}${crcHex}`;
}

/**
 * Render any QRIS payload string into a crisp DataURL PNG image
 */
export async function renderQrisToDataUrl(qrisPayload: string): Promise<string> {
  return await QRCode.toDataURL(qrisPayload, {
    width: 360,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Decode a Static QRIS image file (PNG/JPG/WebP) uploaded by the user.
 * Automatically tries full image + center crop + multi-scale so full GoPay QRIS posters decode reliably.
 */
export async function decodeQrisFromImageFile(
  file: File
): Promise<{ rawPayload: string | null; imageDataUrl: string }> {
  const imageDataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageDataUrl;
  });

  const tryDecodeRegion = (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    targetWidth: number
  ): string | null => {
    const canvas = document.createElement('canvas');
    const scale = targetWidth / sw;
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return code?.data || null;
  };

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // 1. Try full image at multiple resolutions
  for (const targetW of [w, 800, 1200, 500]) {
    if (targetW > 0) {
      const res = tryDecodeRegion(0, 0, w, h, Math.min(1400, targetW));
      if (res && res.includes('000201')) return { rawPayload: res.trim(), imageDataUrl };
    }
  }

  // 2. Try center-cropped regions (common in GoPay / QRIS Nasional poster templates)
  const crops = [
    [w * 0.1, h * 0.15, w * 0.8, h * 0.7],
    [w * 0.15, h * 0.2, w * 0.7, h * 0.6],
    [w * 0.05, h * 0.25, w * 0.9, h * 0.65],
  ];
  for (const [sx, sy, sw, sh] of crops) {
    const res = tryDecodeRegion(sx, sy, sw, sh, 900);
    if (res && res.includes('000201')) return { rawPayload: res.trim(), imageDataUrl };
  }

  return { rawPayload: null, imageDataUrl };
}
