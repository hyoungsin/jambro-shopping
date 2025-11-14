/**
 * 주문(Order) 컨트롤러
 * 주문 관련 비즈니스 로직을 처리합니다.
 */

import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

// 주문 번호 생성 함수
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

// 주문 목록 조회
export async function listOrders(req, res, next) {
  try {
    const userId = req.user._id;
    const userType = req.user.userType;
    const { status, page = 1, limit = 10 } = req.query;

    // 관리자는 모든 주문 조회, 일반 사용자는 본인 주문만 조회
    const query = userType === 'admin' ? {} : { user: userId };
    
    // 상태 필터링
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

// 특정 주문 조회
export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;

    const query = { _id: id };
    // 일반 사용자는 본인 주문만 조회 가능
    if (userType !== 'admin') {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price image category generation');

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

// 주문 생성 (장바구니에서 주문 생성)
export async function createOrder(req, res, next) {
  try {
    const userId = req.user._id;
    const { 
      cartItemIds,  // 장바구니 아이템 ID 배열 (선택 사항)
      items,        // 직접 주문할 상품 정보 (선택 사항)
      shippingAddress,
      payment,
      shippingFee = 3000,
      discountAmount = 0,
      orderNote
    } = req.body;

    // 장바구니에서 주문하는 경우
    let orderItems = [];
    if (cartItemIds && cartItemIds.length > 0) {
      const cartItems = await Cart.find({ 
        _id: { $in: cartItemIds },
        user: userId 
      }).populate('product');

      if (cartItems.length === 0) {
        return res.status(400).json({ message: '장바구니에 상품이 없습니다.' });
      }

      // 장바구니 아이템을 주문 아이템으로 변환
      orderItems = cartItems.map(cartItem => {
        if (!cartItem.product) {
          throw new Error('상품 정보를 찾을 수 없습니다.');
        }
        return {
          product: cartItem.product._id,
          productName: cartItem.product.name,
          productPrice: cartItem.product.price,
          productImage: cartItem.product.image,
          quantity: cartItem.quantity,
          size: cartItem.size,
          color: cartItem.color,
          subtotal: cartItem.product.price * cartItem.quantity
        };
      });
    } 
    // 직접 주문하는 경우
    else if (items && items.length > 0) {
      orderItems = await Promise.all(items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`상품을 찾을 수 없습니다: ${item.product}`);
        }
        return {
          product: product._id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          subtotal: product.price * item.quantity
        };
      }));
    } else {
      return res.status(400).json({ message: '주문할 상품이 없습니다.' });
    }

    // 금액 계산
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const finalAmount = totalAmount + shippingFee - discountAmount;

    // 주문 번호 생성
    let orderNumber = generateOrderNumber();
    // 중복 확인 (매우 드물지만 방지)
    while (await Order.findOne({ orderNumber })) {
      orderNumber = generateOrderNumber();
    }

    // 주문 생성
    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      status: payment.impUid ? 'paid' : 'pending', // 포트원 결제 성공 시 'paid', 아니면 'pending'
      shippingAddress,
      payment: {
        method: payment.method,
        status: payment.impUid ? 'completed' : (payment.status || 'pending'), // 포트원 결제 성공 시 'completed'
        amount: finalAmount,
        paidAt: payment.impUid ? new Date() : (payment.paidAt || null), // 결제 성공 시 현재 시간
        merchantUid: payment.merchantUid || null,
        impUid: payment.impUid || null
      },
      totalAmount,
      shippingFee,
      discountAmount,
      finalAmount,
      orderNote
    });

    await order.save();

    // 장바구니에서 주문한 경우 장바구니 아이템 삭제
    if (cartItemIds && cartItemIds.length > 0) {
      await Cart.deleteMany({ 
        _id: { $in: cartItemIds },
        user: userId 
      });
    }

    // 생성된 주문 정보 반환
    const savedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image category generation');

    res.status(201).json({ 
      message: '주문이 생성되었습니다.',
      order: savedOrder
    });
  } catch (err) {
    next(err);
  }
}

// 주문 상태 수정 (관리자만 가능)
export async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, trackingNumber, shippingCompany } = req.body;
    const userType = req.user.userType;

    // 관리자만 주문 상태 수정 가능
    if (userType !== 'admin') {
      return res.status(403).json({ message: '관리자만 주문 상태를 수정할 수 있습니다.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 상태 업데이트
    if (status) {
      order.status = status;
    }

    // 배송 정보 업데이트
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (shippingCompany) {
      order.shippingCompany = shippingCompany;
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image category generation');

    res.json({ 
      message: '주문 상태가 업데이트되었습니다.',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
}

// 주문 취소 (사용자)
export async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;

    const query = { _id: id };
    // 일반 사용자는 본인 주문만 취소 가능
    if (userType !== 'admin') {
      query.user = userId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 취소 가능한 상태인지 확인
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: '이미 취소된 주문입니다.' });
    }

    if (order.status === 'delivered' || order.status === 'refunded') {
      return res.status(400).json({ message: '배송 완료된 주문은 취소할 수 없습니다.' });
    }

    // 주문 취소
    order.status = 'cancelled';
    if (order.payment.status === 'completed') {
      order.payment.status = 'cancelled';
    }

    await order.save();

    res.json({ 
      message: '주문이 취소되었습니다.',
      order
    });
  } catch (err) {
    next(err);
  }
}

// 결제 완료 처리
export async function completePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { impUid, merchantUid } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 결제 정보 업데이트
    order.payment.status = 'completed';
    order.payment.paidAt = new Date();
    order.status = 'paid';
    
    if (impUid) {
      order.payment.impUid = impUid;
    }
    if (merchantUid) {
      order.payment.merchantUid = merchantUid;
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image category generation');

    res.json({ 
      message: '결제가 완료되었습니다.',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
}

// 관리자 대시보드 통계 조회
export async function getDashboardStats(req, res, next) {
  try {
    const userType = req.user.userType;

    // 관리자만 접근 가능
    if (userType !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    // 쿼리 파라미터에서 년도와 월 가져오기 (선택 사항)
    const { year, month } = req.query;
    const now = new Date();
    
    // 년도와 월이 지정되지 않으면 현재 달 사용
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth(); // month는 0부터 시작
    
    // 해당 달의 시작일과 종료일 계산
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // 해당 달의 마지막 날 계산
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    // 현재 날짜가 해당 달 내에 있으면 오늘까지만, 아니면 해당 달의 마지막 날까지
    const endDate = now.getMonth() === targetMonth && now.getFullYear() === targetYear 
      ? now 
      : endOfMonth;

    // 총 주문 수
    const totalOrders = await Order.countDocuments();

    // 총 상품 수
    const totalProducts = await Product.countDocuments();

    // 총 고객 수 (일반 사용자만, 관리자 제외)
    const totalCustomers = await User.countDocuments({ userType: { $ne: 'admin' } });

    // 총 매출 (결제 완료된 주문의 finalAmount 합계)
    // 지정된 달의 1일부터 해당 달의 마지막 날(또는 오늘)까지의 매출 계산
    const salesResult = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          status: { $ne: 'cancelled' },
          // 결제 완료 시간(paidAt) 또는 주문 생성 시간(createdAt) 기준으로 필터링
          $or: [
            { 'payment.paidAt': { $gte: startOfMonth, $lte: endDate } },
            { 
              'payment.paidAt': { $exists: false },
              createdAt: { $gte: startOfMonth, $lte: endDate }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$finalAmount' }
        }
      }
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

    // 지난달 대비 비교
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const ordersChange = lastMonthOrders > 0 
      ? Math.round(((totalOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;

    const lastMonthProducts = await Product.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const productsChange = lastMonthProducts > 0
      ? Math.round(((totalProducts - lastMonthProducts) / lastMonthProducts) * 100)
      : 0;

    const lastMonthCustomers = await User.countDocuments({
      userType: { $ne: 'admin' },
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const customersChange = lastMonthCustomers > 0
      ? Math.round(((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
      : 0;

    // 지난달 매출 계산
    const lastMonthSalesResult = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          status: { $ne: 'cancelled' },
          $or: [
            { 'payment.paidAt': { $gte: lastMonthStart, $lte: lastMonthEnd } },
            { 
              'payment.paidAt': { $exists: false },
              createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
            }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$finalAmount' }
        }
      }
    ]);
    const lastMonthSales = lastMonthSalesResult.length > 0 ? lastMonthSalesResult[0].totalSales : 0;
    const salesChange = lastMonthSales > 0
      ? Math.round(((totalSales - lastMonthSales) / lastMonthSales) * 100)
      : 0;

    res.json({
      stats: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalSales,
        ordersChange,
        productsChange,
        customersChange,
        salesChange,
        period: {
          year: targetYear,
          month: targetMonth + 1, // 1부터 시작하는 월로 변환
          startDate: startOfMonth.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });
  } catch (err) {
    next(err);
  }
}
