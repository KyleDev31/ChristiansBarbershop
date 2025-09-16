import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'barbershop'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Basic MIME validation (images only)
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          public_id: `${folder}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({ 
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
      width: (result as any).width,
      height: (result as any).height
    }, { status: 200 })

  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { public_id } = await req.json()

    if (!public_id) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 })
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id)

    if (result.result === 'ok') {
      return NextResponse.json({ success: true }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

  } catch (error) {
    console.error('Cloudinary delete failed:', error)
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
