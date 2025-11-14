/**
 * 메인 라우터
 * 모든 하위 라우터를 통합하여 관리합니다.
 * /api 경로 하위에 각 기능별 라우터를 연결합니다.
 */

import { Router } from 'express';
import itemsRouter from './items.js';
import usersRouter from './users.js';
import productsRouter from './products.js';
import cartsRouter from './carts.js';
import ordersRouter from './orders.js';

const router = Router();

// /api/items 경로로 아이템 관련 라우터 연결
router.use('/items', itemsRouter);

// /api/users 경로로 사용자 관련 라우터 연결
router.use('/users', usersRouter);

// /api/products 경로로 상품 관련 라우터 연결
router.use('/products', productsRouter);

// /api/carts 경로로 장바구니 관련 라우터 연결
router.use('/carts', cartsRouter);

// /api/orders 경로로 주문 관련 라우터 연결
router.use('/orders', ordersRouter);

export default router;


