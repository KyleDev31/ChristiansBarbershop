"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteHeader } from "@/components/site-header"
import { AdminGuard } from "@/components/admin-guard"
import { Upload, Trash2, Image as ImageIcon, Folder } from "lucide-react"
import { toast } from "react-hot-toast"

interface ImageUpload {
  url: string
  public_id: string
  width: number
  height: number
}

export default function ImagesPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<ImageUpload[]>([])
  const [selectedFolder, setSelectedFolder] = useState("general")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", selectedFolder)

      const response = await fetch("/api/upload-cloudinary", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      setUploadedImages(prev => [result, ...prev])
      toast.success("Image uploaded successfully!")
      
      // Reset file input
      e.target.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (publicId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      const response = await fetch("/api/upload-cloudinary", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ public_id: publicId })
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      setUploadedImages(prev => prev.filter(img => img.public_id !== publicId))
      toast.success("Image deleted successfully!")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete image")
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard!")
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Image Management</h1>
            <p className="text-muted-foreground">
              Upload and manage images using Cloudinary cloud storage
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New Image
              </CardTitle>
              <CardDescription>
                Images are automatically optimized and stored in the cloud
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="folder">Folder</Label>
                <select
                  id="folder"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="general">General</option>
                  <option value="profiles">Profiles</option>
                  <option value="barbers">Barbers</option>
                  <option value="services">Services</option>
                  <option value="gallery">Gallery</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="file">Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                {uploading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading... Please wait.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Recently Uploaded Images
                </CardTitle>
                <CardDescription>
                  Click on any URL to copy it to clipboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedImages.map((image) => (
                    <div key={image.public_id} className="border rounded-lg p-4">
                      <div className="aspect-square mb-3 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={image.url}
                          alt="Uploaded image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Size:</strong> {image.width} × {image.height}
                        </div>
                        
                        <div className="text-sm">
                          <strong>Public ID:</strong>
                          <code className="block text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                            {image.public_id}
                          </code>
                        </div>
                        
                        <div className="text-sm">
                          <strong>URL:</strong>
                          <button
                            onClick={() => copyToClipboard(image.url)}
                            className="block text-xs bg-blue-100 text-blue-800 p-1 rounded mt-1 break-all hover:bg-blue-200 transition"
                          >
                            {image.url}
                          </button>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(image.public_id)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Cloudinary Storage Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Automatic image optimization</li>
                    <li>• Global CDN delivery</li>
                    <li>• Responsive image generation</li>
                    <li>• No local storage needed</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Usage:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Free tier: 25GB storage</li>
                    <li>• 25GB bandwidth/month</li>
                    <li>• Automatic format conversion</li>
                    <li>• Built-in security</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}

