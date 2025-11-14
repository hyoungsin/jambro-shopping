/**
 * 서버 진입점
 * 데이터베이스 연결 후 HTTP 서버를 시작합니다.
 */

import app from './app.js';
import { connectToDatabase } from './config/db.js';

// 환경변수에서 포트 번호를 가져오거나 기본값 4000 사용
const PORT = process.env.PORT || 4000;

/**
 * 서버 시작 함수
 * 1. 데이터베이스에 연결
 * 2. Express 앱을 지정된 포트에서 시작
 */
async function start() {
  // MongoDB 데이터베이스 연결
  await connectToDatabase();
  
  // Express 앱 시작 (Heroku는 자동으로 PORT 환경변수를 설정합니다)
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// 서버 시작 시도 및 에러 처리
start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


