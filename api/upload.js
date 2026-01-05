// Vercel Serverless Function for file uploads
// Note: For production, consider using Vercel Blob Storage or Firebase Storage
// Vercel serverless functions use ephemeral /tmp storage

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For production file uploads on Vercel, use:
    // 1. Vercel Blob: https://vercel.com/docs/storage/vercel-blob
    // 2. Firebase Storage (already configured in your app)
    // 3. AWS S3, Cloudinary, or other cloud storage

    return res.status(200).json({
      message: 'Upload endpoint ready',
      note: 'Configure Vercel Blob or Firebase Storage for production file uploads'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
