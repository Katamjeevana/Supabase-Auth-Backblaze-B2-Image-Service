const { supabase } = require('../config/supabase');
const { b2 } = require('../config/backblaze');

// Upload image to Backblaze B2
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const userId = req.user.id;

    // Generate unique filename
    const timestamp = Date.now();
    const extension = originalname.split('.').pop();
    const filename = `user_${userId}_${timestamp}.${extension}`;

    // Get upload URL from Backblaze
    const { data: uploadUrlData } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID
    });

    // Upload file to Backblaze
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: filename,
      data: buffer,
      contentLength: size,
      mime: mimetype
    });

    // Construct public URL
    const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${filename}`;

    // Store metadata in Supabase
    const { data, error } = await supabase
      .from('images')
      .insert([
        {
          user_id: userId,
          filename: filename,
          original_name: originalname,
          url: fileUrl,
          size: size
        }
      ])
      .select();

    if (error) {
      console.error('Error storing image metadata:', error);
      return res.status(500).json({ error: 'Failed to store image metadata' });
    }

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: data[0]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all images for the authenticated user
const getImages = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }

    res.json({ images: data });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single image by ID
const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching image:', error);
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ image: data });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an image (bonus)
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First get the image to know the filename
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching image for deletion:', fetchError);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from Backblaze B2
    try {
      // We need to get the fileId first
      const { data: listData } = await b2.listFileNames({
        bucketId: process.env.B2_BUCKET_ID,
        startFileName: image.filename,
        maxFileCount: 1
      });

      if (listData.files.length > 0) {
        await b2.deleteFileVersion({
          fileId: listData.files[0].fileId,
          fileName: image.filename
        });
      }
    } catch (b2Error) {
      console.error('Error deleting from Backblaze:', b2Error);
      // Continue to delete the DB record even if B2 deletion fails
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting image metadata:', deleteError);
      return res.status(500).json({ error: 'Failed to delete image record' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadImage,
  getImages,
  getImage,
  deleteImage
};