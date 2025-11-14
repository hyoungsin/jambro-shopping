/**
 * 장바구니(Cart) 컨트롤러
 * 장바구니 관련 비즈니스 로직을 처리합니다.
 */

import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

// 현재 사용자의 장바구니 목록 조회
export async function listCarts(req, res, next) {
  try {
    const userId = req.user._id; // authenticateToken 미들웨어에서 설정된 사용자 ID

    // 현재 사용자의 장바구니 아이템 조회 (상품 정보 포함)
    const cartItems = await Cart.find({ user: userId })
      .populate('product', 'name price image category generation')
      .sort({ createdAt: -1 });

    res.json({
      cartItems,
      totalItems: cartItems.length,
      totalPrice: cartItems.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0)
    });
  } catch (err) {
    next(err);
  }
}

// 특정 장바구니 아이템 조회
export async function getCart(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const cartItem = await Cart.findOne({ _id: id, user: userId })
      .populate('product', 'name price image category generation description');

    if (!cartItem) {
      return res.status(404).json({ message: '장바구니 아이템을 찾을 수 없습니다.' });
    }

    res.json(cartItem);
  } catch (err) {
    next(err);
  }
}

// 장바구니에 상품 추가
export async function createCart(req, res, next) {
  try {
    const userId = req.user._id;
    const { product, quantity, size, color } = req.body;

    // 필수 필드 검증
    if (!product) {
      return res.status(400).json({ message: '상품 ID는 필수입니다.' });
    }

    // 상품 존재 여부 확인
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 수량 검증
    const qty = quantity || 1;
    if (typeof qty !== 'number' || qty < 1) {
      return res.status(400).json({ message: '수량은 1 이상의 숫자여야 합니다.' });
    }

    // 사이즈 검증
    if (size && !['XS', 'S', 'M', 'L', 'XL'].includes(size)) {
      return res.status(400).json({ message: '유효하지 않은 사이즈입니다.' });
    }

    // 같은 상품, 사이즈, 색상 조합이 이미 장바구니에 있는지 확인
    const existingCartItem = await Cart.findOne({
      user: userId,
      product,
      size: size || null,
      color: color || null
    });

    if (existingCartItem) {
      // 이미 존재하면 수량만 증가
      existingCartItem.quantity += qty;
      await existingCartItem.save();
      
      const updatedCartItem = await Cart.findById(existingCartItem._id)
        .populate('product', 'name price image category generation');
      
      return res.status(200).json({
        message: '장바구니에 수량이 추가되었습니다.',
        cartItem: updatedCartItem
      });
    }

    // 새 장바구니 아이템 생성
    const cartItem = await Cart.create({
      user: userId,
      product,
      quantity: qty,
      size: size || undefined,
      color: color || undefined
    });

    // 상품 정보와 함께 반환
    const populatedCartItem = await Cart.findById(cartItem._id)
      .populate('product', 'name price image category generation');

    res.status(201).json({
      message: '장바구니에 추가되었습니다.',
      cartItem: populatedCartItem
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: '이미 장바구니에 있는 상품입니다.'
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors).map(e => e.message).join(', ')
      });
    }
    next(err);
  }
}

// 장바구니 아이템 수정 (주로 수량 변경)
export async function updateCart(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { quantity, size, color } = req.body;

    // 장바구니 아이템 찾기 (본인 것만 수정 가능)
    const cartItem = await Cart.findOne({ _id: id, user: userId });

    if (!cartItem) {
      return res.status(404).json({ message: '장바구니 아이템을 찾을 수 없습니다.' });
    }

    // 수량 검증
    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: '수량은 1 이상의 숫자여야 합니다.' });
      }
      cartItem.quantity = quantity;
    }

    // 사이즈 검증 및 업데이트
    if (size !== undefined) {
      if (size && !['XS', 'S', 'M', 'L', 'XL'].includes(size)) {
        return res.status(400).json({ message: '유효하지 않은 사이즈입니다.' });
      }
      cartItem.size = size || undefined;
    }

    // 색상 업데이트
    if (color !== undefined) {
      cartItem.color = color || undefined;
    }

    await cartItem.save();

    // 상품 정보와 함께 반환
    const updatedCartItem = await Cart.findById(cartItem._id)
      .populate('product', 'name price image category generation');

    res.json({
      message: '장바구니 아이템이 수정되었습니다.',
      cartItem: updatedCartItem
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors).map(e => e.message).join(', ')
      });
    }
    next(err);
  }
}

// 장바구니 아이템 삭제
export async function deleteCart(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // 장바구니 아이템 찾기 (본인 것만 삭제 가능)
    const cartItem = await Cart.findOne({ _id: id, user: userId });

    if (!cartItem) {
      return res.status(404).json({ message: '장바구니 아이템을 찾을 수 없습니다.' });
    }

    await Cart.findByIdAndDelete(id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// 장바구니 전체 비우기
export async function clearCart(req, res, next) {
  try {
    const userId = req.user._id;

    await Cart.deleteMany({ user: userId });

    res.json({ message: '장바구니가 비워졌습니다.' });
  } catch (err) {
    next(err);
  }
}

