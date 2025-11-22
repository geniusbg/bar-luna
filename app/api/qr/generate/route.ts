import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

interface QRCodeSettings {
  backgroundColor?: string;
  textColor?: string;
  qrCodeColor?: string;
  qrCodeSize?: number;
}

/**
 * Generate QR code with embedded table number text in the center
 * Uses composite approach: QR code as PNG + text overlay as SVG composite
 */
async function generateQRCodeWithTableNumber(
  qrUrl: string,
  tableNumber: number,
  width: number = 400,
  settings: QRCodeSettings = {}
): Promise<string> {
  const {
    backgroundColor = '#FFFFFF',
    textColor = '#000000',
    qrCodeColor = '#000000',
    qrCodeSize = width
  } = settings;

  // Step 1: Generate QR code as PNG buffer directly
  const qrCodeBuffer = await QRCode.toBuffer(qrUrl, {
    type: 'png',
    width: qrCodeSize,
    margin: 0, // No margin to avoid white border
    errorCorrectionLevel: 'H', // High error correction for embedded text
    color: {
      dark: qrCodeColor,
      light: backgroundColor
    }
  });

  // Step 2: Calculate text overlay dimensions
  const fontSize = Math.floor(qrCodeSize * 0.15); // ~15% of QR code width
  const circleRadius = Math.floor(fontSize * 1.5); // Circle behind text
  const text = tableNumber.toString();
  const overlaySize = Math.round(circleRadius * 2.5); // Size of the text overlay (must be integer)

  // Step 3: Create SVG overlay with text and circle
  const centerX = overlaySize / 2;
  const centerY = overlaySize / 2;
  
  const textOverlaySvg = `<svg width="${overlaySize}" height="${overlaySize}" xmlns="http://www.w3.org/2000/svg">
    <!-- White circle background -->
    <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="${backgroundColor}" opacity="0.95"/>
    <!-- Table number text -->
    <text 
      x="${centerX}" 
      y="${centerY}" 
      font-family="Arial, Helvetica, sans-serif" 
      font-size="${fontSize}px" 
      font-weight="bold" 
      fill="${textColor}" 
      text-anchor="middle" 
      dominant-baseline="central"
    >${text}</text>
  </svg>`;

  // Step 4: Convert text overlay SVG to PNG buffer
  const textOverlayBuffer = await sharp(Buffer.from(textOverlaySvg))
    .resize(overlaySize, overlaySize)
    .png()
    .toBuffer();

  // Step 5: Calculate positions for QR code and text overlay
  // QR code is centered in the image
  const qrX = Math.floor((width - qrCodeSize) / 2);
  const qrY = Math.floor((width - qrCodeSize) / 2);
  
  // Text overlay is centered in the image (which centers it on the QR code)
  const textX = Math.floor((width - overlaySize) / 2);
  const textY = Math.floor((width - overlaySize) / 2);

  // Step 6: Create base image with background color and composite QR code and text overlay
  const finalBuffer = await sharp({
    create: {
      width: width,
      height: width,
      channels: 4,
      background: backgroundColor
    }
  })
    .png()
    .composite([
      {
        input: qrCodeBuffer,
        top: qrY,
        left: qrX
      },
      {
        input: textOverlayBuffer,
        top: textY,
        left: textX,
        blend: 'over' // Overlay blend mode
      }
    ])
    .png()
    .toBuffer();

  // Step 8: Convert buffer to data URL
  const dataUrl = `data:image/png;base64,${finalBuffer.toString('base64')}`;

  return dataUrl;
}

export async function POST(request: Request) {
  try {
    const { tableNumber, settings } = await request.json();

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number required' }, { status: 400 });
    }

    // Find table
    const table = await prisma.barTable.findUnique({
      where: { tableNumber: parseInt(tableNumber) }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Generate SHORT QR code URL (dynamic redirect)
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${tableNumber}`;

    // Generate QR code with embedded table number in center
    const qrCodeSize = settings?.qrCodeSize || 400;
    const qrCodeDataUrl = await generateQRCodeWithTableNumber(qrUrl, tableNumber, qrCodeSize, settings);

    // Update table with QR code data and default redirect URL
    await prisma.barTable.update({
      where: { id: table.id },
      data: {
        qrCodeUrl: qrUrl,
        qrCodeData: qrCodeDataUrl,
        redirectUrl: `/bg/order?table=${tableNumber}` // Default redirect
      }
    });

    return NextResponse.json({
      qrCodeDataUrl,
      qrUrl,
      tableNumber,
      tableName: table.tableName
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate all QR codes at once (with settings support)
export async function PUT(request: Request) {
  try {
    const { settings } = await request.json();
    
    const tables = await prisma.barTable.findMany({
      orderBy: { tableNumber: 'asc' }
    });

    const results = [];

    for (const table of tables) {
      // Generate SHORT QR code URL (dynamic redirect)
      const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${table.tableNumber}`;
      
      // Generate QR code with embedded table number in center
      const qrCodeSize = settings?.qrCodeSize || 400;
      const qrCodeDataUrl = await generateQRCodeWithTableNumber(qrUrl, table.tableNumber, qrCodeSize, settings || {});

      await prisma.barTable.update({
        where: { id: table.id },
        data: {
          qrCodeUrl: qrUrl,
          qrCodeData: qrCodeDataUrl,
          redirectUrl: `/bg/order?table=${table.tableNumber}` // Default redirect
        }
      });

      results.push({
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        qrCodeDataUrl,
        qrUrl,
        redirectUrl: `/order?table=${table.tableNumber}`
      });
    }

    return NextResponse.json({ tables: results, count: results.length });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate all QR codes at once (default settings)
export async function GET() {
  try {
    const tables = await prisma.barTable.findMany({
      orderBy: { tableNumber: 'asc' }
    });

    const results = [];

    // Use default settings
    const settings: QRCodeSettings = {};

    for (const table of tables) {
      // Generate SHORT QR code URL (dynamic redirect)
      const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${table.tableNumber}`;
      
      // Generate QR code with embedded table number in center
      const qrCodeSize = settings.qrCodeSize || 400;
      const qrCodeDataUrl = await generateQRCodeWithTableNumber(qrUrl, table.tableNumber, qrCodeSize, settings);

      await prisma.barTable.update({
        where: { id: table.id },
        data: {
          qrCodeUrl: qrUrl,
          qrCodeData: qrCodeDataUrl,
          redirectUrl: `/bg/order?table=${table.tableNumber}` // Default redirect
        }
      });

      results.push({
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        qrCodeDataUrl,
        qrUrl,
        redirectUrl: `/order?table=${table.tableNumber}`
      });
    }

    return NextResponse.json({ tables: results, count: results.length });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


