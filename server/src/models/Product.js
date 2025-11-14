/**
 * 상품(Product) 모델 스키마
 * MongoDB에 저장될 상품 데이터의 구조와 유효성 검증 규칙을 정의합니다.
 */

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // 상품 고유 코드 (Stock Keeping Unit) - 대문자로 저장, 중복 불가
    sku: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true
    },
    // 상품명
    name: {
      type: String,
      required: true,
      trim: true
    },
    // 상품 가격 (0 이상의 숫자)
    price: {
      type: Number,
      required: true,
      min: 0
    },
    // 상품 카테고리 (정해진 값 중 하나만 허용)
    category: {
      type: String,
      required: true,
      enum: ['T셔츠', '하의', '겹겹이', '내의', '악세서리'],
      trim: true
    },
    // 타겟 세대 (정해진 값 중 하나만 허용)
    generation: {
      type: String,
      required: true,
      enum: ['Z세대', 'M세대', '영포티'],
      trim: true
    },
    // 상품 이미지 URL
    image: {
      type: String,
      required: true,
      trim: true
    },
    // 상품 설명 (선택 사항)
    description: {
      type: String,
      required: false,
      trim: true
    }
  },
  { timestamps: true } // createdAt, updatedAt 자동 생성
);

// Product 모델 생성 및 export
export const Product = mongoose.model('Product', productSchema);

