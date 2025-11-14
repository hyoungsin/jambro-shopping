/**
 * 장바구니(Cart) 모델 스키마
 * MongoDB에 저장될 장바구니 데이터의 구조와 유효성 검증 규칙을 정의합니다.
 */

import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    // 사용자 ID (User 모델 참조)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true // 조회 성능 향상을 위한 인덱스
    },
    // 상품 ID (Product 모델 참조)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    // 수량 (최소 1개)
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    // 선택한 사이즈 (선택 사항)
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      required: false,
      trim: true
    },
    // 선택한 색상 (선택 사항)
    color: {
      type: String,
      required: false,
      trim: true
    }
  },
  { timestamps: true } // createdAt, updatedAt 자동 생성
);

// 같은 사용자가 같은 상품, 사이즈, 색상 조합으로 중복 추가하는 것을 방지하기 위한 복합 인덱스
cartSchema.index({ user: 1, product: 1, size: 1, color: 1 }, { unique: true });

// Cart 모델 생성 및 export
export const Cart = mongoose.model('Cart', cartSchema);

