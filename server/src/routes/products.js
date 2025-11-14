/**
 * 상품(Product) 관련 라우터
 * 상품의 CRUD 작업을 처리하는 엔드포인트를 정의합니다.
 */

import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// GET /api/products - 모든 상품 목록 조회 (인증 불필요)
router.get('/', listProducts);

// GET /api/products/:id - 특정 상품 상세 조회 (인증 불필요)
router.get('/:id', getProduct);

// POST /api/products - 새 상품 생성 (인증 필요, 관리자만 가능)
router.post('/', authenticateToken, createProduct);

// PATCH /api/products/:id - 상품 정보 수정 (인증 필요)
router.patch('/:id', authenticateToken, updateProduct);

// DELETE /api/products/:id - 상품 삭제 (인증 필요)
router.delete('/:id', authenticateToken, deleteProduct);

export default router;

