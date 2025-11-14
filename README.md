# Jambro Shopping Mall

세대별 트렌디 패션 쇼핑몰 프로젝트입니다.

## 🛠 기술 스택

### Frontend
- React 19
- Vite
- React Router DOM

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT 인증

## 📁 프로젝트 구조

```
jambro-shopping-mall/
├── client/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/   # 페이지 컴포넌트
│   │   ├── components/  # 공통 컴포넌트
│   │   └── ...
│   └── package.json
├── server/          # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── controllers/  # 컨트롤러
│   │   ├── models/       # 데이터 모델
│   │   ├── routes/       # 라우터
│   │   └── ...
│   └── package.json
└── DEPLOYMENT.md    # 배포 가이드
```

## 🚀 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 18 이상
- MongoDB (로컬 또는 Atlas)

### Backend 설정

```bash
cd server
npm install

# .env 파일 생성
MONGODB_ATLAS=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
PORT=4000

# 개발 서버 실행
npm run dev
```

### Frontend 설정

```bash
cd client
npm install

# .env 파일 생성 (선택사항)
VITE_API_URL=http://localhost:4000

# 개발 서버 실행
npm run dev
```

## 📦 배포

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

### 빠른 배포 순서 (웹 대시보드 방식)
1. GitHub에 코드 푸시
2. MongoDB Atlas 설정
3. Heroku 웹 대시보드에서 Backend 배포
4. Vercel 웹 대시보드에서 Frontend 배포

**빠른 시작:** [QUICK_START.md](./QUICK_START.md) 참고

## 🔑 주요 기능

- 사용자 인증 (회원가입, 로그인)
- 상품 조회 및 검색
- 장바구니 관리
- 주문 생성 및 관리
- 관리자 대시보드
- 상품 관리 (CRUD)
- 주문 관리

## 📝 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.

