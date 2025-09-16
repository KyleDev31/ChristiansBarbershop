#!/usr/bin/env node

/**
 * Migration script to move images from local storage to Cloudinary
 * Run with: node scripts/migrate-to-cloudinary.js
 */

const fs = require('fs')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
require('dotenv').config({ path: '.env.local' })

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

async function uploadFileToCloudinary(filePath, folder = 'migrated') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    })
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      localPath: filePath
    }
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error.message)
    return {
      success: false,
      error: error.message,
      localPath: filePath
    }
  }
}

async function migrateImages() {
  console.log('🚀 Starting migration to Cloudinary...')
  
  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('❌ No uploads directory found. Nothing to migrate.')
    return
  }

  // Get all files in uploads directory
  const files = fs.readdirSync(UPLOADS_DIR)
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  )

  if (imageFiles.length === 0) {
    console.log('❌ No image files found in uploads directory.')
    return
  }

  console.log(`📁 Found ${imageFiles.length} image files to migrate`)

  const results = []
  let successCount = 0
  let errorCount = 0

  // Upload each file
  for (const file of imageFiles) {
    const filePath = path.join(UPLOADS_DIR, file)
    console.log(`📤 Uploading ${file}...`)
    
    const result = await uploadFileToCloudinary(filePath, 'migrated')
    results.push(result)
    
    if (result.success) {
      successCount++
      console.log(`✅ ${file} uploaded successfully`)
    } else {
      errorCount++
      console.log(`❌ ${file} failed: ${result.error}`)
    }
  }

  // Generate migration report
  console.log('\n📊 Migration Report:')
  console.log(`✅ Successful uploads: ${successCount}`)
  console.log(`❌ Failed uploads: ${errorCount}`)
  console.log(`📁 Total files processed: ${imageFiles.length}`)

  // Generate URL mapping file
  const urlMapping = results
    .filter(r => r.success)
    .map(r => ({
      localPath: `/uploads/${path.basename(r.localPath)}`,
      cloudinaryUrl: r.url,
      publicId: r.public_id
    }))

  const mappingFile = path.join(process.cwd(), 'migration-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(urlMapping, null, 2))
  
  console.log(`\n📄 URL mapping saved to: ${mappingFile}`)
  console.log('\n🔧 Next steps:')
  console.log('1. Update your database with the new Cloudinary URLs')
  console.log('2. Test the application with the new URLs')
  console.log('3. Once confirmed working, delete the local uploads directory')
  console.log('4. Delete the migration-mapping.json file')

  // Ask if user wants to delete local files
  if (successCount > 0) {
    console.log('\n⚠️  Do you want to delete the local upload files? (y/N)')
    console.log('   This action cannot be undone!')
    console.log('   Make sure to update your database first.')
  }
}

// Check environment variables
function checkEnvironment() {
  const required = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(key => console.error(`   - ${key}`))
    console.error('\nPlease add these to your .env.local file')
    process.exit(1)
  }
}

// Main execution
async function main() {
  try {
    checkEnvironment()
    await migrateImages()
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { migrateImages, uploadFileToCloudinary }

