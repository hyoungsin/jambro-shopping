import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Orders() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all'); // 선택된 상태 필터
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 주문 상태 필터 옵션
  const statusFilters = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '결제 대기' },
    { value: 'paid', label: '결제 완료' },
    { value: 'preparing', label: '상품 준비' },
    { value: 'shipping', label: '배송중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '주문 취소' }
  ];

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
    async function fetchOrders() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !user) {
        return;
      }

      try {
        setLoading(true);
        // 선택된 상태에 따라 API 호출
        const url = selectedStatus === 'all' 
          ? `${API_URL}/api/orders`
          : `${API_URL}/api/orders?status=${selectedStatus}`;
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('주문 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrders();
    }
  }, [user, selectedStatus, API_URL]);

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

  if (loading) {
    return (
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} onAdmin={handleAdmin} />
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} onAdmin={handleAdmin} />
      
      <main className="main">
        <div className="orders">
          <div className="orders__container">
            <div className="orders__header">
              <h1 className="orders__title">주문 내역</h1>
              <p className="orders__subtitle">주문하신 상품의 내역을 확인하실 수 있습니다.</p>
            </div>

            {/* 주문 상태 필터 */}
            <div className="orders__filters">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`orders__filter-button ${
                    selectedStatus === filter.value ? 'orders__filter-button--active' : ''
                  }`}
                  onClick={() => setSelectedStatus(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="orders__empty">
                <div className="orders__empty-icon">📦</div>
                <h2 className="orders__empty-title">
                  {selectedStatus === 'all' ? '주문 내역이 없습니다' : `${statusFilters.find(f => f.value === selectedStatus)?.label} 주문이 없습니다`}
                </h2>
                <p className="orders__empty-description">
                  {selectedStatus === 'all' ? (
                    <>
                      아직 주문하신 상품이 없습니다.<br />
                      쇼핑을 시작해보세요!
                    </>
                  ) : (
                    <>
                      선택하신 상태의 주문이 없습니다.<br />
                      다른 상태를 선택하거나 쇼핑을 시작해보세요!
                    </>
                  )}
                </p>
                {selectedStatus === 'all' ? (
                  <button 
                    type="button" 
                    className="primary-button orders__empty-button"
                    onClick={() => navigate('/')}
                  >
                    쇼핑하러 가기
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="primary-button orders__empty-button"
                    onClick={() => setSelectedStatus('all')}
                  >
                    전체 주문 보기
                  </button>
                )}
              </div>
            ) : (
              <div className="orders__list">
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-card__header">
                      <div className="order-card__info">
                        <h3 className="order-card__order-number">주문번호: {order.orderNumber}</h3>
                        <span className="order-card__date">
                          {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="order-card__status">
                        <span className={`order-card__status-badge order-card__status-badge--${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="order-card__items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="order-item__image">
                            <img 
                              src={item.productImage || item.product?.image} 
                              alt={item.productName || item.product?.name}
                              onClick={() => navigate(`/products/${item.product?._id || item.product}`)}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div className="order-item__info">
                            <h4 className="order-item__name">
                              {item.productName || item.product?.name}
                            </h4>
                            <div className="order-item__details">
                              <span>수량: {item.quantity}개</span>
                              {item.size && <span>사이즈: {item.size}</span>}
                              {item.color && <span>색상: {item.color}</span>}
                            </div>
                            <div className="order-item__price">
                              ₩{(item.productPrice || item.product?.price || 0) * item.quantity}원
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card__footer">
                      <div className="order-card__summary">
                        <div className="order-card__summary-row">
                          <span>상품 금액</span>
                          <span>₩{order.totalAmount.toLocaleString()}원</span>
                        </div>
                        <div className="order-card__summary-row">
                          <span>배송비</span>
                          <span>{order.shippingFee === 0 ? '무료' : `₩${order.shippingFee.toLocaleString()}원`}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="order-card__summary-row">
                            <span>할인 금액</span>
                            <span>-₩{order.discountAmount.toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="order-card__summary-row order-card__summary-row--total">
                          <span>총 결제 금액</span>
                          <span>₩{order.finalAmount.toLocaleString()}원</span>
                        </div>
                      </div>
                      <div className="order-card__payment-info">
                        <span>결제 수단: {getPaymentMethodLabel(order.payment.method)}</span>
                        <span>결제 상태: {order.payment.status === 'completed' ? '완료' : '대기'}</span>
                      </div>
                      <div className="order-card__actions">
                        <button
                          type="button"
                          className="outline-button order-card__action-button"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          상세보기
                        </button>
                        {order.status === 'pending' || order.status === 'paid' ? (
                          <button
                            type="button"
                            className="outline-button order-card__action-button order-card__action-button--cancel"
                            onClick={async () => {
                              if (!confirm('정말 주문을 취소하시겠습니까?')) {
                                return;
                              }

                              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                              try {
                                const res = await fetch(`${API_URL}/api/orders/${order._id}/cancel`, {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                });

                                if (res.ok) {
                                  alert('주문이 취소되었습니다.');
                                  // 주문 목록 다시 불러오기 (현재 필터 상태 유지)
                                  const url = selectedStatus === 'all' 
                                    ? `${API_URL}/api/orders`
                                    : `${API_URL}/api/orders?status=${selectedStatus}`;
                                  const ordersRes = await fetch(url, {
                                    headers: {
                                      Authorization: `Bearer ${token}`
                                    }
                                  });
                                  if (ordersRes.ok) {
                                    const data = await ordersRes.json();
                                    setOrders(data.orders || []);
                                  }
                                } else {
                                  const errorData = await res.json().catch(() => ({}));
                                  alert(errorData.message || '주문 취소에 실패했습니다.');
                                }
                              } catch (error) {
                                console.error('주문 취소 실패:', error);
                                alert('주문 취소에 실패했습니다.');
                              }
                            }}
                          >
                            주문 취소
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

