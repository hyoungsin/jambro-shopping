/**
 * 서버 진입점
 * 데이터베이스 연결 후 HTTP 서버를 시작합니다.
 */

import http from 'http';
import app from './app.js';
import { connectToDatabase } from './config/db.js';

// 환경변수에서 포트 번호를 가져오거나 기본값 4000 사용
const PORT = process.env.PORT || 4000;

/**
 * 서버 시작 함수
 * 1. 데이터베이스에 연결
 * 2. Express 앱을 HTTP 서버로 생성
 * 3. 지정된 포트에서 서버 시작
 */
async function start() {
  // MongoDB 데이터베이스 연결
  await connectToDatabase();
  
  // Express 앱을 HTTP 서버로 생성
  const server = http.createServer(app);
  
  // 서버 시작 및 포트 리스닝
  // Heroku에서는 0.0.0.0에 바인딩해야 외부 요청을 받을 수 있습니다
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// 서버 시작 시도 및 에러 처리
start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


