/**
 * Express 애플리케이션 설정
 * 미들웨어와 라우터를 설정하여 API 서버를 구성합니다.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const app = express();

// CORS 설정 - 환경변수에서 프론트엔드 URL 가져오기
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const corsOptions = {
  origin: FRONTEND_URL === '*' ? true : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// JSON 요청 본문 파싱 미들웨어
app.use(express.json());

// HTTP 요청 로깅 미들웨어 (개발 모드)
app.use(morgan('dev'));

// 루트 경로 테스트
app.get('/', (req, res) => {
  res.json({ message: 'Jambro Shopping Mall API', status: 'running' });
});

// 헬스 체크 엔드포인트 - 서버 상태 확인용
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// API 라우터 연결 - /api 경로 하위의 모든 라우트 처리
app.use('/api', router);

// 404 에러 핸들러 - 정의되지 않은 경로 요청 처리
app.use(notFoundHandler);

// 전역 에러 핸들러 - 모든 에러를 일관된 형식으로 처리
app.use(errorHandler);

export default app;


