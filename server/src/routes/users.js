import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getCurrentUser
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/login', loginUser);
router.get('/me', authenticateToken, getCurrentUser); // 토큰으로 현재 사용자 정보 가져오기
router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

