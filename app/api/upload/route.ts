import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    // SECURITY: Require authentication for file uploads
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can upload files
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // SECURITY: Validate file type strictly
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG or WebP' }, { status: 400 });
    }

    // SECURITY: Validate file extension matches MIME type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!fileExt || !validExtensions.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    // SECURITY: Double-check MIME type matches extension
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    };
    const allowedExts = mimeToExt[file.type];
    if (!allowedExts || !allowedExts.includes(fileExt)) {
      return NextResponse.json({ error: 'File type mismatch' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY: Verify file signature (magic numbers) - prevents fake file types
    // This checks the actual file content, not just MIME type or extension
    const detectedType = await fileTypeFromBuffer(buffer);
    
    if (!detectedType) {
      return NextResponse.json({ 
        error: 'Cannot detect file type. File may be corrupted or invalid.' 
      }, { status: 400 });
    }

    // Only allow image types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(detectedType.mime)) {
      return NextResponse.json({ 
        error: `Invalid file type detected: ${detectedType.mime}. Only JPEG, PNG, and WebP images are allowed.` 
      }, { status: 400 });
    }

    // SECURITY: Verify that browser-reported MIME type matches actual file content
    // This prevents MIME type spoofing attacks
    if (file.type !== detectedType.mime) {
      return NextResponse.json({ 
        error: 'File type mismatch: MIME type does not match actual file content. Possible file type spoofing detected.' 
      }, { status: 400 });
    }

    // SECURITY: Verify that file extension matches detected type
    const detectedExt = detectedType.ext;
    const validExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    };
    const validExts = validExtensionMap[detectedType.mime];
    if (!validExts || !validExts.includes(detectedExt)) {
      return NextResponse.json({ 
        error: `File extension mismatch: detected type is ${detectedType.mime} but extension is ${detectedExt}` 
      }, { status: 400 });
    }

    // Use external directory (protected from deploy)
    // Try production path first, fallback to local
    const productionUploadDir = '/var/www/uploads/bar-luna';
    const localUploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Check if production directory exists
    const uploadDir = existsSync(productionUploadDir) 
      ? productionUploadDir 
      : localUploadDir;
    
    console.log('Using upload directory:', uploadDir);
    
    if (!existsSync(uploadDir)) {
      console.log('Creating uploads directory:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
    }

    // OPTIMIZATION: Process image with sharp
    // - Resize to max 1200px (larger dimension)
    // - Convert to WebP for better compression (or keep PNG if transparent)
    // - Compress with quality 85%
    let optimizedBuffer: Buffer;
    let outputExt: string;
    let outputFileName: string;

    try {
      const sharpImage = sharp(buffer);
      const metadata = await sharpImage.metadata();
      const isPng = detectedType.mime === 'image/png';
      const hasTransparency = isPng && metadata.hasAlpha;

      // Build processing pipeline
      let pipeline = sharpImage;

      // Resize if image is larger than 1200px
      if (metadata.width && metadata.height) {
        const maxDimension = Math.max(metadata.width, metadata.height);
        if (maxDimension > 1200) {
          pipeline = pipeline.resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          });
          console.log(`Resizing image from ${metadata.width}x${metadata.height} to max 1200px`);
        }
      }

      // Convert to WebP (better compression) unless PNG with transparency
      if (hasTransparency) {
        // Keep PNG format if it has transparency (WebP supports it but PNG is more compatible)
        optimizedBuffer = await pipeline
          .png({ quality: 85, compressionLevel: 9 })
          .toBuffer();
        outputExt = 'png';
        console.log('Keeping PNG format (has transparency)');
      } else {
        // Convert to WebP for better compression
        optimizedBuffer = await pipeline
          .webp({ quality: 85 })
          .toBuffer();
        outputExt = 'webp';
        console.log('Converting to WebP format');
      }

      // Generate unique filename with optimized extension
      outputFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${outputExt}`;
      const filePath = join(uploadDir, outputFileName);
      
      await writeFile(filePath, optimizedBuffer);
      
      const originalSize = (buffer.length / 1024 / 1024).toFixed(2);
      const optimizedSize = (optimizedBuffer.length / 1024 / 1024).toFixed(2);
      const reduction = (((buffer.length - optimizedBuffer.length) / buffer.length) * 100).toFixed(1);
      
      console.log(`✅ File optimized: ${originalSize}MB → ${optimizedSize}MB (${reduction}% reduction)`);
      console.log(`✅ File saved successfully: ${outputFileName}`);

      // Return public URL
      const publicUrl = `/uploads/${outputFileName}`;
      return NextResponse.json({ url: publicUrl }, { status: 200 });

    } catch (optimizationError) {
      // Fallback: if optimization fails, save original file
      console.warn('⚠️ Image optimization failed, saving original:', optimizationError);
      const safeFileExt = detectedExt;
      outputFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${safeFileExt}`;
      const filePath = join(uploadDir, outputFileName);
      
      await writeFile(filePath, buffer);
      console.log('✅ Original file saved (optimization failed):', outputFileName);
      
      const publicUrl = `/uploads/${outputFileName}`;
      return NextResponse.json({ url: publicUrl }, { status: 200 });
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


