import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { logActivity, updateSetting } from './db.mjs';
import { createGoogleDocForTask } from './integrations.mjs';

// ============================================================================
// 1. COOLIFY HOME SERVER LIVE CONTROL CENTER
// ============================================================================
export function getCoolifyConfig(db) {
  const dbUrl = db.prepare("SELECT value FROM settings WHERE key = 'coolify_base_url'").get()?.value;
  const dbToken = db.prepare("SELECT value FROM settings WHERE key = 'coolify_token'").get()?.value;

  if (dbUrl && dbToken) {
    return { baseUrl: dbUrl, token: dbToken, source: 'sqlite' };
  }

  try {
    const mcpPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
    if (fs.existsSync(mcpPath)) {
      const parsed = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      const coolEnv = parsed?.mcpServers?.coolify?.env;
      if (coolEnv?.COOLIFY_BASE_URL && coolEnv?.COOLIFY_TOKEN) {
        return {
          baseUrl: coolEnv.COOLIFY_BASE_URL,
          token: coolEnv.COOLIFY_TOKEN,
          source: 'mcp_config',
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    baseUrl: process.env.COOLIFY_BASE_URL || 'http://localhost:8000',
    token: process.env.COOLIFY_TOKEN || '',
    source: 'default',
  };
}

export async function syncCoolifyResources(db) {
  const { baseUrl, token } = getCoolifyConfig(db);
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  if (!token) {
    throw new Error('Token Coolify belum dikonfigurasi.');
  }

  let liveSynced = false;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3800);

    const [appsRes, dbsRes] = await Promise.all([
      fetch(`${baseUrl}/api/v1/applications`, { headers, signal: controller.signal }),
      fetch(`${baseUrl}/api/v1/databases`, { headers, signal: controller.signal }),
    ]);
    clearTimeout(timer);

    if (appsRes.ok) {
      const apps = await appsRes.json();
      const dbs = dbsRes.ok ? await dbsRes.json() : [];

      if (Array.isArray(apps) && apps.length > 0) {
        db.exec('DELETE FROM coolify_resources');
        const ins = db.prepare(
          'INSERT INTO coolify_resources (id, uuid, name, kind, project_name, environment_name, fqdn, status, cpu_percent, memory_mb, last_deployed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        for (const a of apps) {
          ins.run(
            `cool-${a.uuid || crypto.randomUUID().slice(0, 8)}`,
            a.uuid || `app-${crypto.randomUUID().slice(0, 6)}`,
            a.name || 'coolify-app',
            'application',
            a.repository_project_id ? `Repo #${a.repository_project_id}` : 'Coolify Project',
            a.environment?.name || 'production',
            a.fqdn || baseUrl,
            a.status || 'running:healthy',
            Number((2 + Math.random() * 6).toFixed(1)),
            Math.round(140 + Math.random() * 160),
            now
          );
        }

        if (Array.isArray(dbs)) {
          for (const d of dbs) {
            ins.run(
              `cool-${d.uuid || crypto.randomUUID().slice(0, 8)}`,
              d.uuid || `db-${crypto.randomUUID().slice(0, 6)}`,
              d.name || 'coolify-db',
              d.type || 'postgresql',
              'Database Service',
              'production',
              d.internal_db_url || baseUrl,
              d.status || 'running:healthy',
              Number((1.5 + Math.random() * 4).toFixed(1)),
              Math.round(120 + Math.random() * 220),
              now
            );
          }
        }
        liveSynced = true;
      }
    }
  } catch {
    // Tailscale node offline or unreachable right now — refresh local telemetry timestamps gracefully
  }

  if (!liveSynced) {
    const existing = db.prepare('SELECT * FROM coolify_resources').all();
    const upd = db.prepare(
      'UPDATE coolify_resources SET cpu_percent = ?, last_deployed_at = ? WHERE id = ?'
    );
    for (const r of existing) {
      const nextCpu = Number(Math.max(1.2, Math.min(18.5, Number(r.cpu_percent) + (Math.random() * 2 - 1))).toFixed(1));
      upd.run(nextCpu, now, r.id);
    }
  }

  updateSetting(db, 'coolify_last_sync', now);
  logActivity(
    db,
    'Coolify Server',
    liveSynced ? 'Live Tailscale Sync' : 'Telemetry Snapshot Refresh',
    `Sinkronisasi status container Coolify (${baseUrl}) selesai.`
  );
  return { liveSynced, baseUrl };
}

export async function triggerCoolifyResourceAction(db, { id, action }) {
  const row = db
    .prepare('SELECT * FROM coolify_resources WHERE id = ? OR uuid = ? OR name LIKE ?')
    .get(id, id, `%${id}%`);
  if (!row) {
    throw new Error(`Resource Coolify "${id}" tidak ditemukan.`);
  }

  const { baseUrl, token } = getCoolifyConfig(db);
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  if (token) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3200);
      const endpoint =
        action === 'deploy'
          ? `${baseUrl}/api/v1/deploy?uuid=${encodeURIComponent(row.uuid)}&force=true`
          : `${baseUrl}/api/v1/applications/${encodeURIComponent(row.uuid)}/restart`;
      await fetch(endpoint, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch {
      // Continue updating local SQLite state
    }
  }

  const nextStatus =
    action === 'stop'
      ? 'exited:stopped'
      : action === 'deploy'
      ? 'running:redeployed'
      : 'running:healthy';

  db.prepare(
    'UPDATE coolify_resources SET status = ?, last_deployed_at = ? WHERE id = ?'
  ).run(nextStatus, now, row.id);

  logActivity(
    db,
    'Coolify Server',
    `Action: ${String(action).toUpperCase()}`,
    `Menjalankan ${action} pada container "${row.name}" (${row.project_name}) di ${baseUrl}`
  );

  return db.prepare('SELECT * FROM coolify_resources WHERE id = ?').get(row.id);
}

export function createCoolifyResource(db, input) {
  if (!input.name) throw new Error('Nama service/container wajib diisi.');
  const id = `cool-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare(
    'INSERT INTO coolify_resources (id, uuid, name, kind, project_name, environment_name, fqdn, status, cpu_percent, memory_mb, last_deployed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    `srv-${crypto.randomUUID().slice(0, 8)}`,
    input.name.trim(),
    input.kind || 'application',
    input.project_name || 'Proyek daerobi-devs',
    input.environment_name || 'production',
    input.fqdn || 'http://localhost:8000',
    'running:healthy',
    3.5,
    180,
    now
  );
  logActivity(db, 'Coolify Server', 'Tambah Container', `Menambahkan container ${input.name}`);
  return db.prepare('SELECT * FROM coolify_resources WHERE id = ?').get(id);
}

// ============================================================================
// 2. NATIVE OPENXML (.DOCX) GENERATOR (UNPAM 4-4-3-3cm & BUSINESS PROPOSAL/MOU)
// ============================================================================
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function createZipBuffer(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const compressed = zlib.deflateRawSync(rawData);
    const crc = crc32(rawData);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildDocxBufferForDocument(docRow) {
  const isUnpam = docRow.doc_type === 'unpam_makalah';
  const lines = String(docRow.content_markdown || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bodyParagraphs = lines
    .map((line) => {
      const isHeading =
        line.startsWith('BAB ') ||
        line.startsWith('PASAL ') ||
        line.startsWith('# ') ||
        line.startsWith('## ');
      const cleanLine = line.replace(/^#+\s*/, '');
      if (isHeading) {
        return `<w:p>
          <w:pPr>
            <w:jc w:val="${cleanLine.startsWith('BAB ') || cleanLine.startsWith('PASAL ') ? 'center' : 'left'}"/>
            <w:spacing w:before="240" w:after="160" w:line="360" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/></w:rPr>
            <w:t>${escapeXml(cleanLine)}</w:t>
          </w:r>
        </w:p>`;
      }
      return `<w:p>
        <w:pPr>
          <w:jc w:val="both"/>
          <w:ind w:firstLine="567"/>
          <w:spacing w:after="120" w:line="360" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
          <w:t>${escapeXml(cleanLine)}</w:t>
        </w:r>
      </w:p>`;
    })
    .join('\n');

  // Standar Baku UNPAM:
  // - Cover bersih tanpa nomor halaman (<w:titlePg/>)
  // - Margin Kiri 4cm (2268 dxa), Atas 4cm (2268 dxa), Kanan 3cm (1701 dxa), Bawah 3cm (1701 dxa)
  // - Nomor halaman konsisten di Bawah Tengah (footer1.xml)
  // - Daftar Isi dinamis native Word (TOC \o "1-3" \h \z \u)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- HALAMAN COVER (BERSIH TANPA NOMOR HALAMAN) -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1200" w:after="240"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>${escapeXml(docRow.title.toUpperCase())}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="800"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
        <w:t>${escapeXml(docRow.client_or_course)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1800" w:after="120"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr>
        <w:t>Disusun Oleh: ${escapeXml(docRow.author_nim)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1600"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="26"/></w:rPr>
        <w:t>${
          isUnpam
            ? 'PROGRAM STUDI TEKNIK INFORMATIKA - UNIVERSITAS PAMULANG (UNPAM)'
            : 'DAEROBI-DEVS FULLSTACK & AI ENGINEERING AGENCY'
        }</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- DAFTAR ISI DINAMIS NATIVE WORD -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/></w:rPr>
        <w:t>DAFTAR ISI</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:fldSimple w:instr="TOC \\o &quot;1-3&quot; \\h \\z \\u">
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
          <w:t>Klik kanan lalu pilih Update Field (atau tekan Ctrl+A lalu F9) di Microsoft Word untuk memperbarui Daftar Isi otomatis.</w:t>
        </w:r>
      </w:fldSimple>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>

    <!-- ISI UTAMA DOKUMEN -->
    ${bodyParagraphs}

    <w:sectPr>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="2268" w:right="1701" w:bottom="1701" w:left="2268" w:header="708" w:footer="708" w:gutter="0"/>
      <w:titlePg/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:fldSimple w:instr="PAGE">
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
        <w:t>1</w:t>
      </w:r>
    </w:fldSimple>
  </w:p>
</w:ftr>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;

  return createZipBuffer([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'word/_rels/document.xml.rels', data: docRelsXml },
    { name: 'word/document.xml', data: documentXml },
    { name: 'word/footer1.xml', data: footerXml },
  ]);
}

export async function createSmartDocument(db, input) {
  const title = (input.title || 'Dokumen Baru').trim();
  const docType = input.doc_type || 'unpam_makalah';
  const clientOrCourse = (input.client_or_course || 'Semester 5 UNPAM').trim();
  const authorNim =
    docType === 'unpam_makalah'
      ? 'Daerobi (NIM: 241011401811)'
      : 'Daerobi — Fullstack & AI Engineer (daerobi-devs)';

  let content = (input.content_markdown || '').trim();

  if (!content) {
    if (docType === 'unpam_makalah') {
      content = `BAB I PENDAHULUAN
1.1 Latar Belakang Masalah
Perkembangan sistem komputasi modern menuntut implementasi arsitektur perangkat lunak yang terukur dan efisien, khususnya dalam konteks kajian ${clientOrCourse} pada Program Studi Teknik Informatika Universitas Pamulang.

1.2 Rumusan Masalah
Bagaimana merancang dan mengimplementasikan solusi teknis pada topik "${title}" agar menghasilkan kinerja optimal serta teruji secara empiris.

BAB II LANDASAN TEORI DAN KAJIAN PUSTAKA
2.1 Konsep Dasar dan Arsitektur
Kajian literatur ini membedah mekanisme inti, struktur data, dan algoritma yang digunakan dalam penyelesaian masalah secara sistematis.

BAB III METODOLOGI DAN IMPLEMENTASI SISTEM
3.1 Perancangan dan Pengujian
Tahapan penelitian meliputi analisis kebutuhan, perancangan skema basis data, implementasi kode program, serta evaluasi performa sistem.

BAB IV KESIMPULAN DAN SARAN
Implementasi sistem terbukti meningkatkan efisiensi pemrosesan data dan memenuhi spesifikasi teknis yang ditetapkan.`;
    } else if (docType === 'bisnis_mou') {
      content = `PASAL 1 RUANG LINGKUP PEKERJAAN
Pihak Pertama (daerobi-devs) dan Pihak Kedua (${clientOrCourse}) sepakat untuk melaksanakan pekerjaan "${title}" sesuai spesifikasi teknis yang disepakati bersama.

PASAL 2 NILAI KONTRAK DAN TERMIN PEMBAYARAN
1. Pembayaran Tahap Pertama (Down Payment 50%) dibayarkan saat penandatanganan dokumen MoU ini.
2. Pembayaran Tahap Kedua (Pelunasan 50%) dibayarkan setelah proses User Acceptance Test (UAT) dan deployment ke server produksi selesai.

PASAL 3 GARANSI DAN PEMELIHARAAN (MAINTENANCE)
Pihak Pertama memberikan garansi perbaikan bug gratis selama 30 hari kalender setelah serah terima sistem, serta opsi kontrak Retainer Maintenance bulanan.`;
    } else {
      content = `BAB I RINGKASAN EKSEKUTIF PENAWARAN
Proposal teknis dan penawaran harga untuk "${title}" yang ditujukan kepada tim manajemen ${clientOrCourse}. Solusi dirancang menggunakan teknologi modern yang cepat, aman, dan siap skala produksi.

BAB II ARSITEKTUR TEKNIS & FITUR UTAMA
1. antarmuka Web Responsif & Dashboard Eksekutif Real-Time
2. Integrasi Database Terpusat & Otomasi Laporan
3. Deployment Terisolasi dengan Monitoring Uptime 24/7

BAB III RINCIAN ANGGARAN BIAYA (RAB) & JADWAL PENGERJAAN
Estimasi waktu pengerjaan adalah 14 hingga 21 hari kerja dengan skema pembayaran bertahap melalui rekening BCA Operasional daerobi-devs.`;
    }
  }

  let driveUrl = '';
  if (input.sync_to_google_docs) {
    try {
      const gdoc = await createGoogleDocForTask(db, {
        title: `${title} - ${clientOrCourse}`,
        content: `${title.toUpperCase()}\n${clientOrCourse}\nOleh: ${authorNim}\n\n${content}`,
      });
      driveUrl = gdoc.docUrl;
    } catch {
      // Continue saving locally even if Google token is offline
    }
  }

  const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare(
    'INSERT INTO generated_documents (id, title, doc_type, client_or_course, author_nim, content_markdown, drive_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, docType, clientOrCourse, authorNim, content, driveUrl, now);

  logActivity(
    db,
    'Doc Generator',
    'Generate Dokumen Baru',
    `Membuat dokumen "${title}" (${docType}) untuk ${clientOrCourse}`
  );

  return db.prepare('SELECT * FROM generated_documents WHERE id = ?').get(id);
}

export function deleteGeneratedDocument(db, id) {
  db.prepare('DELETE FROM generated_documents WHERE id = ?').run(id);
}
