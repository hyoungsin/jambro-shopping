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

// CORS 설정 - Vercel 도메인과 로컬 개발 환경 허용
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  // Vercel 도메인 패턴 허용
  /^https:\/\/jambro-shopping.*\.vercel\.app$/,
  /^https:\/\/.*-hyoungsin-ohs-projects\.vercel\.app$/,
];

// 환경변수에 FRONTEND_URL이 있으면 추가
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // origin이 없는 경우 (같은 도메인 요청 또는 Postman 등) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    // 허용된 origin인지 확인
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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


