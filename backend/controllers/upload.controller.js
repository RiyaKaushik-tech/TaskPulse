import path from "path";
import multer from "multer";
import fs from "fs";

// create uploads dir if not exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
}).array("files", 10);

export const uploadFiles = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const files = (req.files || []).map((f) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(f.filename)}`,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: `/uploads/${encodeURIComponent(f.filename)}`,
    }));
    return res.json({ success: true, files });
  });
};

export default uploadFiles;