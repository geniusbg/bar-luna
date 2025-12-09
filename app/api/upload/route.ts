import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Generate unique filename (already validated fileExt above)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

    // Save file
    const filePath = join(uploadDir, fileName);
    console.log('Saving file to:', filePath);
    
    await writeFile(filePath, buffer);
    console.log('✅ File saved successfully:', fileName);

    // Return public URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


