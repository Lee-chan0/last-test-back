import * as cheerio from 'cheerio';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './fileUploader.js';

// data URI 처리 및 S3 업로드 함수
export async function processArticleContent(html) {
  const $ = cheerio.load(html);
  const imgTags = $('img');
  const uploadPromises = [];
  const processedImages = [];

  imgTags.each((index, el) => {
    const src = $(el).attr('src');
    if (src && src.startsWith('data:')) {
      // 정규식을 사용하여 MIME 타입과 Base64 데이터를 추출
      const matches = src.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length < 3) return;

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // MIME 타입에 따라 확장자 결정
      let ext = '';
      if (mimeType === 'image/jpeg') ext = '.jpg';
      else if (mimeType === 'image/png') ext = '.png';

      // 고유한 파일명 생성
      const fileKey = `uploads/${Date.now()}_${ext}`;

      const uploadParams = {
        Bucket: "my-bucket-test", // 사용 중인 버킷명으로 교체
        Key: fileKey,
        Body: buffer,
        ACL: "public-read",
        ContentEncoding: 'base64',
        ContentType: mimeType
      };

      const promise = s3.send(new PutObjectCommand(uploadParams))
        .then(() => {
          const s3Url = `https://kr.object.ncloudstorage.com/my-bucket-test/${fileKey}`;
          $(el).attr('src', s3Url);
          processedImages.push(s3Url);
        })
        .catch(err => {
          console.error("이미지 업로드 실패", err);
        });
      uploadPromises.push(promise);
    }
  });

  await Promise.all(uploadPromises);
  return { html: $.html(), images: processedImages };
}