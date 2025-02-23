import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import dotenv from 'dotenv';

dotenv.config();

// 네이버 클라우드 Object Storage 설정 (AWS SDK v3 방식)
const s3 = new S3Client({
  endpoint: "https://kr.object.ncloudstorage.com",
  region: "kr-standard",
  credentials: {
    accessKeyId: process.env.NAVER_CLOUD_ACCESS_KEY,
    secretAccessKey: process.env.NAVER_CLOUD_SECRET_ACCESS_KEY
  }
});

// multer 설정 (메모리 저장소 사용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".jpeg", ".jpg", ".png", ".gif"];
    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileMime = file.mimetype;

    if (allowedExt.includes(fileExt) && allowedMime.includes(fileMime)) {
      return cb(null, true);
    } else {
      // 에러를 넘기면 Express 에러 처리 미들웨어에서 status 설정을 할 수 있음
      const err = new Error("이미지 파일만 업로드 가능합니다.");
      err.status = 400; // HTTP 400 Bad Request
      return cb(err);
    }
  }
});

export { upload, s3 };