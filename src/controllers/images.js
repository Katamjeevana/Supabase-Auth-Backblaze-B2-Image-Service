const { supabase } = require('../config/supabase');
const { b2 } = require('../config/backblaze');

// 🔹 Verify user with Supabase JWT
const getAuthenticatedUser = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw { status: 401, message: 'Access token required' };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw { status: 403, message: 'Invalid or expired token' };
  }

  const { data: customUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (userError || !customUser) {
    throw { status: 403, message: 'User not found in application database' };
  }

  return customUser; // customUser.id is your "app user_id"
};

// 🔹 Upload image to Backblaze B2
const uploadImage = async (req, res) => {
  try {
    const customUser = await getAuthenticatedUser(req);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const extension = originalname.split('.').pop();
    const filename = `${customUser.id}/${Date.now()}.${extension}`;

    // Get upload URL from Backblaze
    const { data: uploadUrlData } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID
    });

    // Upload file to Backblaze
    await b2.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: filename,
      data: buffer,
      contentLength: size,
      mime: mimetype
    });

    // Construct public URL
    const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${filename}`;

    // Save metadata in Supabase
    const { data: image, error: dbError } = await supabase
      .from('images')
      .insert([{
        user_id: customUser.id,
        filename,
        original_name: originalname,
        url: fileUrl,
        size,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return res.status(500).json({ error: 'Failed to save image metadata' });
    }

    res.json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// 🔹 Get all images
const getImages = async (req, res) => {
  try {
    const customUser = await getAuthenticatedUser(req);

    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', customUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch images' });
    }

    res.json({ images: images || [] });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// 🔹 Get single image
const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const customUser = await getAuthenticatedUser(req);

    const { data: image, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', customUser.id)
      .single();

    if (error || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ image });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

// 🔹 Delete image (B2 + DB)
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const customUser = await getAuthenticatedUser(req);

    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', customUser.id)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from Backblaze
    try {
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
    }

    // Delete from Supabase DB
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', customUser.id);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete image record' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = { uploadImage, getImages, getImage, deleteImage };
