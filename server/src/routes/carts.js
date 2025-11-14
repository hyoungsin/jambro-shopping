/**
 * 장바구니(Cart) 관련 라우터
 * 장바구니의 CRUD 작업을 처리하는 엔드포인트를 정의합니다.
 */

import { Router } from 'express';
import {
  listCarts,
  getCart,
  createCart,
  updateCart,
  deleteCart,
  clearCart
} from '../controllers/cartController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// 모든 장바구니 라우트는 인증이 필요합니다
router.use(authenticateToken);

// GET /api/carts - 현재 사용자의 장바구니 목록 조회
router.get('/', listCarts);

// GET /api/carts/clear - 장바구니 전체 비우기
router.delete('/clear', clearCart);

// GET /api/carts/:id - 특정 장바구니 아이템 조회
router.get('/:id', getCart);

// POST /api/carts - 장바구니에 상품 추가
router.post('/', createCart);

// PATCH /api/carts/:id - 장바구니 아이템 수정 (수량, 사이즈, 색상 변경)
router.patch('/:id', updateCart);

// DELETE /api/carts/:id - 장바구니 아이템 삭제
router.delete('/:id', deleteCart);

export default router;

