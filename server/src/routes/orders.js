/**
 * 주문(Order) 관련 라우터
 * 주문의 CRUD 작업을 처리하는 엔드포인트를 정의합니다.
 */

import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  cancelOrder,
  completePayment,
  getDashboardStats
} from '../controllers/orderController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// 모든 주문 라우트는 인증이 필요합니다
router.use(authenticateToken);

// GET /api/orders/stats - 관리자 대시보드 통계 조회
router.get('/stats', getDashboardStats);

// GET /api/orders - 주문 목록 조회 (사용자는 본인 주문만, 관리자는 전체)
router.get('/', listOrders);

// GET /api/orders/:id - 특정 주문 상세 조회
router.get('/:id', getOrder);

// POST /api/orders - 주문 생성 (장바구니에서 주문 생성)
router.post('/', createOrder);

// PATCH /api/orders/:id - 주문 상태 수정 (관리자만 가능)
router.patch('/:id', updateOrder);

// POST /api/orders/:id/cancel - 주문 취소 (사용자)
router.post('/:id/cancel', cancelOrder);

// POST /api/orders/:id/payment - 결제 완료 처리
router.post('/:id/payment', completePayment);

export default router;

