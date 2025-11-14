/**
 * 주문(Order) 모델 스키마
 * MongoDB에 저장될 주문 데이터의 구조와 유효성 검증 규칙을 정의합니다.
 */

import mongoose from 'mongoose';

// 주문 상품 정보 서브 스키마
const orderItemSchema = new mongoose.Schema({
  // 상품 ID (Product 모델 참조)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // 상품명 (주문 시점의 상품명 저장 - 상품명 변경 대비)
  productName: {
    type: String,
    required: true,
    trim: true
  },
  // 상품 가격 (주문 시점의 가격 저장 - 가격 변경 대비)
  productPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // 상품 이미지 (주문 시점의 이미지 저장)
  productImage: {
    type: String,
    required: true,
    trim: true
  },
  // 수량
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // 선택한 사이즈
  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL'],
    required: false,
    trim: true
  },
  // 선택한 색상
  color: {
    type: String,
    required: false,
    trim: true
  },
  // 소계 (상품 가격 * 수량)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false }); // _id 없이 저장

const orderSchema = new mongoose.Schema(
  {
    // 주문 번호 (고유 번호, 예: ORD-20240101-0001)
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    // 사용자 ID (User 모델 참조)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // 주문 상품 목록
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: '주문 상품이 최소 1개 이상 필요합니다.'
      }
    },
    // 주문 상태
    status: {
      type: String,
      enum: [
        'pending',      // 결제 대기
        'paid',         // 결제 완료
        'preparing',    // 배송 준비중
        'shipping',     // 배송중
        'delivered',    // 배송 완료
        'cancelled',    // 주문 취소
        'refunded'      // 환불 완료
      ],
      default: 'pending',
      required: true
    },
    // 배송지 정보
    shippingAddress: {
      recipientName: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      address: {
        type: String,
        required: true,
        trim: true
      },
      addressDetail: {
        type: String,
        required: false,
        trim: true
      },
      postalCode: {
        type: String,
        required: false,
        trim: true
      },
      deliveryRequest: {
        type: String,
        required: false,
        trim: true
      }
    },
    // 결제 정보
    payment: {
      method: {
        type: String,
        enum: ['card', 'bank', 'kakao', 'naver', 'toss'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      // 결제 일시
      paidAt: {
        type: Date,
        required: false
      }
    },
    // 총 주문 금액
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // 배송비
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    // 할인 금액
    discountAmount: {
      type: Number,
      required: false,
      min: 0,
      default: 0
    },
    // 최종 결제 금액 (총 주문 금액 + 배송비 - 할인 금액)
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // 배송 추적 번호
    trackingNumber: {
      type: String,
      required: false,
      trim: true
    },
    // 배송사
    shippingCompany: {
      type: String,
      required: false,
      trim: true
    },
    // 주문 메모 (고객이 남긴 메모)
    orderNote: {
      type: String,
      required: false,
      trim: true
    }
  },
  { timestamps: true } // createdAt, updatedAt 자동 생성
);

// 주문 번호 생성 인덱스 (조회 성능 향상)
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 }); // 사용자별 최신 주문 조회
orderSchema.index({ status: 1 }); // 상태별 조회

// 주문 번호 자동 생성 미들웨어 (선택 사항 - 컨트롤러에서 생성하는 것을 권장)
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(dateStr),
        $lt: new Date(dateStr + 'T23:59:59.999Z')
      }
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Order 모델 생성 및 export
export const Order = mongoose.model('Order', orderSchema);

