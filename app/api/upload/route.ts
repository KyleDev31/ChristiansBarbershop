import { NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Basic MIME validation (images only)
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg"
    const baseName = (formData.get("filename") as string) || file.name?.split(".")[0] || "upload"
    const safeBase = baseName.replace(/[^a-z0-9-_]/gi, "_")
    const fileName = `${Date.now()}_${safeBase}${ext}`
    const filePath = path.join(uploadsDir, fileName)

    await fs.writeFile(filePath, buffer)

    // Public URL that can be stored in profile
    const url = `/uploads/${fileName}`
    return NextResponse.json({ url }, { status: 200 })
  } catch (err) {
    console.error("Upload failed", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fileParam = searchParams.get("file")
    if (!fileParam) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 })
    }
    // Only allow deletion inside public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const target = path.normalize(path.join(uploadsDir, path.basename(fileParam)))
    if (!target.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }
    await fs.unlink(target)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Delete failed", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}


