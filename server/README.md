# Jambro Shopping Mall - Server

## 1) 환경 변수 설정
`jambro-shopping-mall/server/.env` 파일을 생성하고 아래 값을 추가하세요:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/jambro_mall
```

## 2) 의존성 설치
PowerShell:

```
cd D:\\BIG\\vive-coding\\jambro-shopping-mall\\server; npm install
```

## 3) 개발 서버 실행
```
npm run dev
```
- 서버: `http://localhost:4000`
- 헬스체크: `GET /health`
- API Prefix: `/api`

## 예시 엔드포인트 (Item)
- 목록: `GET /api/items`
- 생성: `POST /api/items` (JSON `{ "title": "상품명" }`)
- 토글: `PATCH /api/items/:id/toggle`
- 삭제: `DELETE /api/items/:id`

## 구조
```
server/
  src/
    config/db.js
    controllers/itemController.js
    middlewares/errorHandler.js
    models/Item.js
    routes/
      index.js
      items.js
    app.js
    server.js
  package.json
  .gitignore
  README.md
```

