# Cloudinary Image Storage Setup

This guide explains how to set up Cloudinary for cloud-based image storage in your barbershop application, replacing local file storage to keep your project lightweight.

## Why Cloudinary?

- **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **CDN**: Global content delivery network for fast loading
- **Transformations**: On-the-fly image resizing, cropping, and format conversion
- **No Local Storage**: Keeps your project lightweight and scalable

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials

1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy your credentials:
   - **Cloud Name**: Found in the dashboard
   - **API Key**: Found in the dashboard  
   - **API Secret**: Found in the dashboard

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Test the Setup

1. Start your development server: `npm run dev`
2. Go to your profile page
3. Try uploading a profile picture
4. Check that the image appears correctly

## Features Implemented

### ✅ Automatic Image Optimization
- Images are automatically compressed and optimized
- Format conversion (WebP for modern browsers)
- Quality optimization based on content

### ✅ Responsive Images
- Automatic resizing for different screen sizes
- Thumbnail generation for profile pictures
- Multiple size variants available

### ✅ Organized Storage
- Images are organized in folders:
  - `profiles/` - User profile pictures
  - `barbers/` - Barber profile pictures
  - `barbershop/` - General barbershop images

### ✅ Easy Management
- Public IDs for easy image management
- Delete functionality for removing old images
- URL generation for different transformations

## API Endpoints

### Upload Image
- **POST** `/api/upload-cloudinary`
- **Body**: FormData with `file` and optional `folder`
- **Response**: `{ url, public_id, width, height }`

### Delete Image
- **DELETE** `/api/upload-cloudinary`
- **Body**: `{ public_id }`
- **Response**: `{ success: boolean }`

## Usage Examples

### Upload Profile Picture
```javascript
const formData = new FormData()
formData.append('file', file)
formData.append('folder', 'profiles')

const response = await fetch('/api/upload-cloudinary', {
  method: 'POST',
  body: formData
})

const { url, public_id } = await response.json()
```

### Delete Old Image
```javascript
const response = await fetch('/api/upload-cloudinary', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ public_id: 'old_image_id' })
})
```

## Image Transformations

Cloudinary automatically applies these transformations:

- **Max Size**: 800x800 pixels (prevents huge uploads)
- **Quality**: Auto-optimized based on content
- **Format**: Auto-converted to WebP when supported
- **Crop**: Limit mode (maintains aspect ratio)

## Benefits Over Local Storage

### ✅ Performance
- CDN delivery for fast loading worldwide
- Automatic image optimization
- Responsive image generation

### ✅ Scalability
- No local storage limits
- Automatic backup and redundancy
- Easy to scale with user growth

### ✅ Maintenance
- No need to manage local file storage
- Automatic cleanup of unused images
- Built-in security and access controls

### ✅ Cost Effective
- Free tier covers most small to medium applications
- Pay only for what you use
- No server storage costs

## Migration from Local Storage

If you have existing images in local storage:

1. **Export existing images**: Download images from `public/uploads/`
2. **Upload to Cloudinary**: Use the Cloudinary dashboard or API
3. **Update database**: Replace local URLs with Cloudinary URLs
4. **Remove local files**: Delete the `public/uploads/` directory

## Security Considerations

- API keys are server-side only (never exposed to client)
- Images are stored securely in Cloudinary's cloud
- Access control through signed URLs if needed
- Automatic virus scanning on uploads

## Monitoring and Analytics

Cloudinary provides:
- Upload statistics and bandwidth usage
- Image optimization reports
- Performance analytics
- Storage usage monitoring

## Troubleshooting

### Common Issues

1. **Upload fails**: Check environment variables are correct
2. **Images not loading**: Verify Cloudinary URLs are accessible
3. **Slow uploads**: Check internet connection and file size
4. **Format issues**: Ensure file types are supported (JPEG, PNG, WebP, GIF)

### Debug Mode

Enable debug logging by adding to your environment:
```bash
CLOUDINARY_DEBUG=true
```

## Alternative Services

If you prefer other cloud storage options:

- **AWS S3**: More complex setup but very scalable
- **Google Cloud Storage**: Good integration with Firebase
- **Azure Blob Storage**: Microsoft's cloud storage solution
- **ImgBB**: Simple image hosting service

## Support

For Cloudinary-specific issues:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com)
- [Cloudinary Community](https://cloudinary.com/community)

For application-specific issues, check the server logs and ensure all environment variables are properly configured.
