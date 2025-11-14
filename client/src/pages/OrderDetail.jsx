import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 주문 상태 한글 변환
  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': '결제 대기',
      'paid': '결제 완료',
      'preparing': '배송 준비중',
      'shipping': '배송중',
      'delivered': '배송 완료',
      'cancelled': '주문 취소',
      'refunded': '환불 완료'
    };
    return statusMap[status] || status;
  };

  // 결제 수단 한글 변환
  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'card': '신용카드',
      'bank': '무통장 입금',
      'kakao': '카카오페이',
      'toss': '토스페이',
      'naver': '네이버페이'
    };
    return methodMap[method] || method;
  };

  // 배송 현황 단계 계산
  const getShippingSteps = (order) => {
    const steps = [
      { key: 'pending', label: '결제 대기', completed: false, active: false },
      { key: 'paid', label: '결제 완료', completed: false, active: false },
      { key: 'preparing', label: '배송 준비중', completed: false, active: false },
      { key: 'shipping', label: '배송중', completed: false, active: false },
      { key: 'delivered', label: '배송 완료', completed: false, active: false }
    ];

    const statusOrder = ['pending', 'paid', 'preparing', 'shipping', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return steps.map(step => ({ ...step, completed: false, active: false }));
    }

    return steps.map((step, index) => {
      if (index < currentIndex) {
        return { ...step, completed: true, active: false };
      } else if (index === currentIndex) {
        return { ...step, completed: false, active: true };
      } else {
        return { ...step, completed: false, active: false };
      }
    });
  };

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        navigate('/login');
      }
    }

    fetchUser();
  }, [API_URL, navigate]);

  useEffect(() => {
    async function fetchOrder() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !user || !id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const orderData = await res.json();
          setOrder(orderData);
        } else if (res.status === 404) {
          setError('주문을 찾을 수 없습니다.');
        } else {
          setError('주문 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('주문 정보 가져오기 실패:', error);
        setError('주문 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrder();
    }
  }, [user, id, API_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleAdmin = () => {
    if (user?.userType === 'admin') {
      navigate('/admin');
    } else {
      alert('관리자만 접근할 수 있습니다.');
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('정말 주문을 취소하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('주문이 취소되었습니다.');
        // 주문 정보 다시 불러오기
        const orderRes = await fetch(`${API_URL}/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || '주문 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      alert('주문 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onAdmin={handleAdmin}
        />
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="app">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onAdmin={handleAdmin}
        />
        <main className="main">
          <div className="order-detail">
            <div className="order-detail__container">
              <div className="order-detail__error">
                <div className="order-detail__error-icon">⚠️</div>
                <h2 className="order-detail__error-title">주문을 찾을 수 없습니다</h2>
                <p className="order-detail__error-description">
                  {error || '요청하신 주문 정보를 찾을 수 없습니다.'}
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate('/orders')}
                >
                  주문 목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const shippingSteps = getShippingSteps(order);

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onAdmin={handleAdmin}
      />
      
      <main className="main">
        <div className="order-detail">
          <div className="order-detail__container">
            {/* 헤더 */}
            <div className="order-detail__header">
              <button
                type="button"
                className="order-detail__back-button"
                onClick={() => navigate('/orders')}
              >
                ← 주문 목록으로
              </button>
              <h1 className="order-detail__title">주문 상세</h1>
            </div>

            {/* 주문 정보 카드 */}
            <div className="order-detail__card">
              <div className="order-detail__card-header">
                <div className="order-detail__order-info">
                  <h2 className="order-detail__order-number">주문번호: {order.orderNumber}</h2>
                  <p className="order-detail__order-date">
                    주문일시: {new Date(order.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="order-detail__status-badge-wrapper">
                  <span className={`order-detail__status-badge order-detail__status-badge--${order.status}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              {/* 배송 현황 */}
              <div className="order-detail__shipping-status">
                <h3 className="order-detail__section-title">배송 현황</h3>
                <div className="order-detail__shipping-steps">
                  {shippingSteps.map((step, index) => (
                    <div key={step.key} className="order-detail__shipping-step">
                      <div className={`order-detail__step-circle ${
                        step.completed ? 'order-detail__step-circle--completed' : 
                        step.active ? 'order-detail__step-circle--active' : 
                        'order-detail__step-circle--inactive'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <span className={`order-detail__step-label ${
                        step.active ? 'order-detail__step-label--active' : ''
                      }`}>
                        {step.label}
                      </span>
                      {index < shippingSteps.length - 1 && (
                        <div className={`order-detail__step-line ${
                          step.completed ? 'order-detail__step-line--completed' : ''
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                {order.trackingNumber && (
                  <div className="order-detail__tracking-info">
                    <div className="order-detail__tracking-item">
                      <span className="order-detail__tracking-label">배송사:</span>
                      <span className="order-detail__tracking-value">
                        {order.shippingCompany || '미지정'}
                      </span>
                    </div>
                    <div className="order-detail__tracking-item">
                      <span className="order-detail__tracking-label">송장번호:</span>
                      <span className="order-detail__tracking-value">{order.trackingNumber}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 주문 상품 */}
              <div className="order-detail__products">
                <h3 className="order-detail__section-title">주문 상품</h3>
                <div className="order-detail__product-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-detail__product-item">
                      <div className="order-detail__product-image">
                        <img 
                          src={item.productImage || item.product?.image} 
                          alt={item.productName || item.product?.name}
                          onClick={() => navigate(`/products/${item.product?._id || item.product}`)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="order-detail__product-info">
                        <h4 className="order-detail__product-name">
                          {item.productName || item.product?.name}
                        </h4>
                        <div className="order-detail__product-details">
                          <span>수량: {item.quantity}개</span>
                          {item.size && <span>사이즈: {item.size}</span>}
                          {item.color && <span>색상: {item.color}</span>}
                        </div>
                        <div className="order-detail__product-price">
                          ₩{(item.productPrice || item.product?.price || 0) * item.quantity}원
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 배송지 정보 */}
              <div className="order-detail__shipping-address">
                <h3 className="order-detail__section-title">배송지 정보</h3>
                <div className="order-detail__address-content">
                  <p className="order-detail__address-line">
                    <strong>받는 분:</strong> {order.shippingAddress.recipientName}
                  </p>
                  <p className="order-detail__address-line">
                    <strong>연락처:</strong> {order.shippingAddress.phone}
                  </p>
                  <p className="order-detail__address-line">
                    <strong>주소:</strong> {order.shippingAddress.address}
                    {order.shippingAddress.addressDetail && ` ${order.shippingAddress.addressDetail}`}
                  </p>
                  {order.shippingAddress.postalCode && (
                    <p className="order-detail__address-line">
                      <strong>우편번호:</strong> {order.shippingAddress.postalCode}
                    </p>
                  )}
                  {order.shippingAddress.deliveryRequest && (
                    <p className="order-detail__address-line">
                      <strong>배송 요청사항:</strong> {order.shippingAddress.deliveryRequest}
                    </p>
                  )}
                </div>
              </div>

              {/* 결제 정보 */}
              <div className="order-detail__payment">
                <h3 className="order-detail__section-title">결제 정보</h3>
                <div className="order-detail__payment-content">
                  <div className="order-detail__payment-row">
                    <span>결제 수단</span>
                    <span>{getPaymentMethodLabel(order.payment.method)}</span>
                  </div>
                  <div className="order-detail__payment-row">
                    <span>결제 상태</span>
                    <span className={order.payment.status === 'completed' ? 'order-detail__payment-status--completed' : ''}>
                      {order.payment.status === 'completed' ? '완료' : 
                       order.payment.status === 'cancelled' ? '취소됨' : '대기'}
                    </span>
                  </div>
                  {order.payment.paidAt && (
                    <div className="order-detail__payment-row">
                      <span>결제 일시</span>
                      <span>
                        {new Date(order.payment.paidAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 주문 금액 요약 */}
              <div className="order-detail__summary">
                <h3 className="order-detail__section-title">주문 금액</h3>
                <div className="order-detail__summary-content">
                  <div className="order-detail__summary-row">
                    <span>상품 금액</span>
                    <span>₩{order.totalAmount.toLocaleString()}원</span>
                  </div>
                  <div className="order-detail__summary-row">
                    <span>배송비</span>
                    <span>{order.shippingFee === 0 ? '무료' : `₩${order.shippingFee.toLocaleString()}원`}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="order-detail__summary-row">
                      <span>할인 금액</span>
                      <span>-₩{order.discountAmount.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="order-detail__summary-row order-detail__summary-row--total">
                    <span>총 결제 금액</span>
                    <span>₩{order.finalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 주문 메모 */}
              {order.orderNote && (
                <div className="order-detail__note">
                  <h3 className="order-detail__section-title">주문 메모</h3>
                  <p className="order-detail__note-content">{order.orderNote}</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="order-detail__actions">
                {(order.status === 'pending' || order.status === 'paid') && (
                  <button
                    type="button"
                    className="outline-button order-detail__action-button order-detail__action-button--cancel"
                    onClick={handleCancelOrder}
                  >
                    주문 취소
                  </button>
                )}
                <button
                  type="button"
                  className="primary-button order-detail__action-button"
                  onClick={() => navigate('/orders')}
                >
                  주문 목록으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

