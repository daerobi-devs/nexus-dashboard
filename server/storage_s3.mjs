import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvIfNeeded() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore
  }
}

export function getS3Config() {
  loadEnvIfNeeded();
  const endpoint = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
  const publicUrl = process.env.S3_PUBLIC_URL || endpoint;
  const consoleUrl = process.env.S3_CONSOLE_URL || '';
  const region = process.env.S3_REGION || 'us-east-1';
  const accessKey = process.env.S3_ACCESS_KEY || '';
  const secretKey = process.env.S3_SECRET_KEY || '';
  const bucket = process.env.S3_BUCKET || 'nexus-assets';
  return { endpoint, publicUrl, consoleUrl, region, accessKey, secretKey, bucket };
}

let cachedClient = null;
let cachedKeySignature = '';

export function getS3Client() {
  const cfg = getS3Config();
  if (!cfg.accessKey || !cfg.secretKey) {
    throw new Error('Kredensial MinIO S3 (S3_ACCESS_KEY / S3_SECRET_KEY) belum dikonfigurasi pada environment variables.');
  }
  const sig = `${cfg.endpoint}|${cfg.region}|${cfg.accessKey}|${cfg.secretKey}`;
  if (!cachedClient || cachedKeySignature !== sig) {
    cachedClient = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secretKey,
      },
      forcePathStyle: true,
    });
    cachedKeySignature = sig;
  }
  return { client: cachedClient, cfg };
}

/**
 * Ensure the target MinIO bucket exists and is configured for public read
 */
export async function ensureMinioBucket() {
  const { client, cfg } = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      await client.send(new CreateBucketCommand({ Bucket: cfg.bucket }));
    }
  }

  // Ensure PublicRead policy so assets can be rendered directly in browser/dashboard
  try {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'NexusPublicRead',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${cfg.bucket}/*`],
        },
      ],
    };
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: cfg.bucket,
        Policy: JSON.stringify(policy),
      })
    );
  } catch {
    // Policy may already be set or non-critical
  }
}

/**
 * Robust MIME Type resolver with file extension fallback
 */
export function resolveMimeType(fileName = '', clientMime = '') {
  const ext = path.extname(fileName).toLowerCase();

  const map = {
    // Video
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/mp4',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    // Documents
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.txt': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.json': 'application/json',
    '.md': 'text/markdown; charset=utf-8',
    // Images
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
  };

  if (map[ext]) return map[ext];
  if (clientMime && clientMime !== 'application/octet-stream') return clientMime;
  return 'application/octet-stream';
}

/**
 * Categorize MIME types into broad groups (image, video, document, audio, archive, other)
 */
export function getAssetCategory(mimeType = '', fileName = '') {
  const mime = (mimeType || '').toLowerCase();
  const ext = path.extname(fileName || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.ico'].includes(ext)
  ) {
    return 'image';
  }
  if (
    mime.startsWith('video/') ||
    ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'].includes(ext)
  ) {
    return 'video';
  }
  if (
    mime.startsWith('audio/') ||
    ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext)
  ) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    mime.includes('text') ||
    ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.md'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    mime.includes('archive') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)
  ) {
    return 'archive';
  }
  return 'other';
}

/**
 * Compress images using Sharp (WebP lossless/high-quality conversion)
 * Leaves PDFs, videos, and non-raster documents untouched in binary fidelity
 */
export async function autoCompressFile(buffer, mimeType, fileName) {
  const category = getAssetCategory(mimeType, fileName);
  const originalSize = buffer.length;

  if (category === 'image') {
    // Check if SVG - do not rasterize SVG, keep vector
    if (mimeType.includes('svg') || fileName.toLowerCase().endsWith('.svg')) {
      return {
        compressedBuffer: buffer,
        mimeType: 'image/svg+xml',
        finalFileName: fileName,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        isCompressed: false,
      };
    }

    try {
      // Auto-compress raster image: rotate by EXIF, resize max width/height to 2560px, convert to WebP q82
      const img = sharp(buffer, { failOn: 'none' });
      const metadata = await img.metadata();

      let pipeline = img.rotate();
      if (metadata.width && metadata.width > 2560) {
        pipeline = pipeline.resize({ width: 2560, withoutEnlargement: true });
      } else if (metadata.height && metadata.height > 2560) {
        pipeline = pipeline.resize({ height: 2560, withoutEnlargement: true });
      }

      const compressedBuffer = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer();
      const compressedSize = compressedBuffer.length;

      if (compressedSize < originalSize) {
        const baseName = path.parse(fileName).name;
        const finalFileName = `${baseName}.webp`;
        const compressionRatio = Number(
          (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
        );

        return {
          compressedBuffer,
          mimeType: 'image/webp',
          finalFileName,
          originalSize,
          compressedSize,
          compressionRatio,
          isCompressed: true,
        };
      }
    } catch (compressErr) {
      console.warn('[Sharp Compress Warning]', compressErr?.message);
    }
  }

  return {
    compressedBuffer: buffer,
    mimeType: resolveMimeType(fileName, mimeType),
    finalFileName: fileName,
    originalSize,
    compressedSize: originalSize,
    compressionRatio: 0,
    isCompressed: false,
  };
}

/**
 * Upload an asset buffer to MinIO S3 with explicit ContentDisposition: inline
 */
export async function uploadAssetToStorage(db, { name, mimeType, buffer, tags = [] }) {
  await ensureMinioBucket();
  const { client, cfg } = getS3Client();

  const originalSize = buffer.length;
  const resolvedMime = resolveMimeType(name, mimeType);
  const compressionResult = await autoCompressFile(buffer, resolvedMime, name);
  const finalMime = compressionResult.mimeType || resolvedMime;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const fileId = `ast-${crypto.randomUUID().slice(0, 8)}`;
  const sanitizedName = compressionResult.finalFileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
  const s3Key = `assets/${year}/${month}/${fileId}-${sanitizedName}`;

  // Upload to MinIO S3 with inline disposition so browser previews/plays instead of forcing download
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: s3Key,
      Body: compressionResult.compressedBuffer,
      ContentType: finalMime,
      ContentDisposition: 'inline',
      Metadata: {
        'original-filename': encodeURIComponent(name),
        'original-size': String(originalSize),
        'compressed-size': String(compressionResult.compressedSize),
        'uploaded-by': 'nexus-os',
      },
    })
  );

  const publicUrl = `${cfg.publicUrl.replace(/\/+$/, '')}/${cfg.bucket}/${s3Key}`;
  const category = getAssetCategory(finalMime, compressionResult.finalFileName);
  const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');

  const assetRow = {
    id: fileId,
    name: compressionResult.finalFileName,
    s3_key: s3Key,
    bucket: cfg.bucket,
    mime_type: finalMime,
    category,
    original_size: originalSize,
    compressed_size: compressionResult.compressedSize,
    compression_ratio: compressionResult.compressionRatio,
    url: publicUrl,
    tags: JSON.stringify(tags),
    created_at: createdAt,
  };

  const insertSql = `
    INSERT INTO storage_assets (
      id, name, s3_key, bucket, mime_type, category, original_size, compressed_size, compression_ratio, url, tags, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.prepare(insertSql).run(
    assetRow.id,
    assetRow.name,
    assetRow.s3_key,
    assetRow.bucket,
    assetRow.mime_type,
    assetRow.category,
    assetRow.original_size,
    assetRow.compressed_size,
    assetRow.compression_ratio,
    assetRow.url,
    assetRow.tags,
    assetRow.created_at
  );

  return {
    ...assetRow,
    tags: Array.isArray(tags) ? tags : [],
  };
}

/**
 * Retrieve assets list with aggregate storage statistics
 */
export function getStorageAssetsState(db, { category, search, limit = 100 } = {}) {
  let query = 'SELECT * FROM storage_assets';
  const params = [];
  const conditions = [];

  if (category && category !== 'ALL') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (search && search.trim()) {
    conditions.push('(name LIKE ? OR tags LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params);
  const assets = rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags || '[]'),
    original_size: Number(r.original_size),
    compressed_size: Number(r.compressed_size),
    compression_ratio: Number(r.compression_ratio),
  }));

  const allRows = db.prepare('SELECT original_size, compressed_size FROM storage_assets').all();
  const totalCount = allRows.length;
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  for (const r of allRows) {
    totalOriginalSize += Number(r.original_size) || 0;
    totalCompressedSize += Number(r.compressed_size) || 0;
  }

  const totalSavedBytes = Math.max(0, totalOriginalSize - totalCompressedSize);
  const overallSavedPercentage =
    totalOriginalSize > 0
      ? Number(((totalSavedBytes / totalOriginalSize) * 100).toFixed(1))
      : 0;

  const cfg = getS3Config();

  return {
    assets,
    stats: {
      totalCount,
      totalOriginalSize,
      totalCompressedSize,
      totalSavedBytes,
      overallSavedPercentage,
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      consoleUrl: cfg.consoleUrl,
    },
  };
}

/**
 * Fetch raw object from MinIO for in-dashboard streaming/inline viewing
 */
export async function getAssetObject(bucket, key, range) {
  const { client, cfg } = getS3Client();
  const params = {
    Bucket: bucket || cfg.bucket,
    Key: key,
  };
  if (range) params.Range = range;
  return await client.send(new GetObjectCommand(params));
}

/**
 * Delete asset from MinIO S3 and database
 */
export async function deleteAssetFromStorage(db, id) {
  const row = db.prepare('SELECT * FROM storage_assets WHERE id = ?').get(id);
  if (!row) return false;

  try {
    const { client } = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: row.bucket,
        Key: row.s3_key,
      })
    );
  } catch (err) {
    console.warn('[MinIO S3 Delete Warning]', err?.message);
  }

  db.prepare('DELETE FROM storage_assets WHERE id = ?').run(id);
  return true;
}
