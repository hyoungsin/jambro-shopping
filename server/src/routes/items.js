/**
 * 아이템(Item) 관련 라우터
 * 할 일 목록 관리 기능을 제공하는 엔드포인트를 정의합니다.
 */

import { Router } from 'express';
import { listItems, createItem, toggleItem, deleteItem } from '../controllers/itemController.js';

const router = Router();

// GET /api/items - 모든 아이템 목록 조회
router.get('/', listItems);

// POST /api/items - 새 아이템 생성
router.post('/', createItem);

// PATCH /api/items/:id/toggle - 아이템 완료 상태 토글
router.patch('/:id/toggle', toggleItem);

// DELETE /api/items/:id - 아이템 삭제
router.delete('/:id', deleteItem);

export default router;


