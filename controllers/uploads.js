import multer from 'multer';
import shortid from 'shortid';
import fs from 'fs';
import Upload from '../models/upload';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.type == 'image') cb(null, './uploads/images');
    if (file.type == 'video') cb(null, './uploads/videos');
  },
  filename(req, file, cb) {
    file.id = shortid.generate();
    cb(null, `${file.id}.${file.extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const videoExtensions = ['mov', 'mp4', 'webm'];
  const imageExtensions = ['jpg', 'svg', 'jpeg', 'png', 'gif'];

  file.extension = file.originalname.split('.').pop();

  if (videoExtensions.includes(file.extension)) {
    file.type = 'video';
    cb(null, true);
  } else if (imageExtensions.includes(file.extension)) {
    file.type = 'image';
    cb(null, true);
  } else cb(null, false);
};

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: process.env.MAX_UPLOAD_SIZE,
  },
  fileFilter,
});

export const uploadFile = async (req, res) => {
  if (req.file) {
    await Upload.create({
      name: req.file.id,
      author: req.user.id,
      type: req.file.type,
      path: req.file.path,
    })
      .catch(err => res.status(500).send(err));

    res.status(201).json({
      status: 'file uploaded',
      url: `${process.env.SITE_URL}/api/1/${req.file.type == 'image' ? 'i' : 'v'}/${req.file.filename}`,
      mediaName: req.file.id,
    });
  } else {
    res.status(500).json({ errors: 'internal server error' });
  }
};

export const deleteFile = path => {
  if (path.split('/')[0] === 'uploads') {
    fs.unlink(path, async err => {
      if (err) throw err;
      await Upload.deleteOne({ path });
    });
  }
};

export default {
  uploadFile,
  multerUpload,
  deleteFile,
};
