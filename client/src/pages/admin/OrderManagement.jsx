import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function OrderManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    trackingNumber: '',
    shippingCompany: ''
  });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const limit = 10;

  // 주문 상태 필터 옵션
  const statusFilters = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '결제 대기' },
    { value: 'paid', label: '결제 완료' },
    { value: 'preparing', label: '상품 준비' },
    { value: 'shipping', label: '배송중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '주문 취소' },
    { value: 'refunded', label: '환불 완료' }
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

          if (userData.userType !== 'admin') {
            alert('관리자만 접근할 수 있습니다.');
            navigate('/');
          }
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
      if (!token || !user || user.userType !== 'admin') {
        return;
      }

      try {
        setLoading(true);
        const url = selectedStatus === 'all'
          ? `${API_URL}/api/orders?page=${currentPage}&limit=${limit}`
          : `${API_URL}/api/orders?status=${selectedStatus}&page=${currentPage}&limit=${limit}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('주문 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && user.userType === 'admin') {
      fetchOrders();
    }
  }, [user, selectedStatus, currentPage, API_URL]);

  const handleEditClick = (order) => {
    setEditingOrder(order._id);
    setEditForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      shippingCompany: order.shippingCompany || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditForm({
      status: '',
      trackingNumber: '',
      shippingCompany: ''
    });
  };

  const handleSaveEdit = async (orderId) => {
    if (!editForm.status) {
      alert('주문 상태를 선택해주세요.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      // 빈 문자열이 아닌 값만 전송
      const updateData = {
        status: editForm.status
      };
      
      if (editForm.trackingNumber && editForm.trackingNumber.trim()) {
        updateData.trackingNumber = editForm.trackingNumber.trim();
      }
      
      if (editForm.shippingCompany && editForm.shippingCompany.trim()) {
        updateData.shippingCompany = editForm.shippingCompany.trim();
      }

      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        alert('주문 정보가 업데이트되었습니다.');
        setEditingOrder(null);
        // 주문 목록 다시 불러오기
        const url = selectedStatus === 'all'
          ? `${API_URL}/api/orders?page=${currentPage}&limit=${limit}`
          : `${API_URL}/api/orders?status=${selectedStatus}&page=${currentPage}&limit=${limit}`;
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
        alert(errorData.message || '주문 정보 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 정보 업데이트 실패:', error);
      alert('주문 정보 업데이트에 실패했습니다.');
    }
  };

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
        <div className="order-management">
          <div className="order-management__container">
            <div className="order-management__header">
              <div className="order-management__header-left">
                <h1 className="order-management__title">
                  <span className="order-management__title-icon">📦</span>
                  주문 관리
                </h1>
              </div>
              <button
                type="button"
                className="outline-button"
                onClick={() => navigate('/admin')}
              >
                대시보드로 돌아가기
              </button>
            </div>

            {/* 주문 상태 필터 */}
            <div className="order-management__filters">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`order-management__filter-button ${
                    selectedStatus === filter.value ? 'order-management__filter-button--active' : ''
                  }`}
                  onClick={() => {
                    setSelectedStatus(filter.value);
                    setCurrentPage(1);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="order-management__empty">
                <div className="order-management__empty-icon">📦</div>
                <h2 className="order-management__empty-title">
                  {selectedStatus === 'all' ? '주문이 없습니다' : `${statusFilters.find(f => f.value === selectedStatus)?.label} 주문이 없습니다`}
                </h2>
              </div>
            ) : (
              <>
                <div className="order-management__table-wrapper">
                  <table className="order-management__table">
                    <thead>
                      <tr>
                        <th>주문번호</th>
                        <th>고객명</th>
                        <th>주문일시</th>
                        <th>상품</th>
                        <th>결제수단</th>
                        <th>금액</th>
                        <th>상태</th>
                        <th>배송정보</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <button
                              type="button"
                              className="order-management__order-number"
                              onClick={() => navigate(`/orders/${order._id}`)}
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td>{order.user?.name || '-'}</td>
                          <td>
                            {new Date(order.createdAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <div className="order-management__products">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <span key={idx} className="order-management__product-name">
                                  {item.productName || item.product?.name}
                                  {item.quantity > 1 && ` (${item.quantity})`}
                                </span>
                              ))}
                              {order.items.length > 2 && (
                                <span className="order-management__product-more">
                                  외 {order.items.length - 2}개
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{getPaymentMethodLabel(order.payment?.method)}</td>
                          <td className="order-management__amount">₩{order.finalAmount?.toLocaleString()}</td>
                          <td>
                            {editingOrder === order._id ? (
                              <select
                                className="order-management__status-select"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                autoFocus
                              >
                                <option value="">상태 선택</option>
                                <option value="pending">결제 대기</option>
                                <option value="paid">결제 완료</option>
                                <option value="preparing">배송 준비중</option>
                                <option value="shipping">배송중</option>
                                <option value="delivered">배송 완료</option>
                                <option value="cancelled">주문 취소</option>
                                <option value="refunded">환불 완료</option>
                              </select>
                            ) : (
                              <button
                                type="button"
                                className={`order-management__status-badge order-management__status-badge--${order.status} order-management__status-badge--clickable`}
                                onClick={() => handleEditClick(order)}
                                title="클릭하여 상태 수정"
                              >
                                {getStatusLabel(order.status)}
                              </button>
                            )}
                          </td>
                          <td>
                            {editingOrder === order._id ? (
                              <div className="order-management__edit-shipping">
                                <input
                                  type="text"
                                  className="order-management__input"
                                  placeholder="배송사"
                                  value={editForm.shippingCompany}
                                  onChange={(e) => setEditForm({ ...editForm, shippingCompany: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="order-management__input"
                                  placeholder="송장번호"
                                  value={editForm.trackingNumber}
                                  onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                                />
                              </div>
                            ) : (
                              <div className="order-management__shipping-info">
                                {order.shippingCompany && <span>{order.shippingCompany}</span>}
                                {order.trackingNumber && <span>{order.trackingNumber}</span>}
                                {!order.shippingCompany && !order.trackingNumber && <span>-</span>}
                              </div>
                            )}
                          </td>
                          <td>
                            {editingOrder === order._id ? (
                              <div className="order-management__edit-actions">
                                <button
                                  type="button"
                                  className="order-management__save-button"
                                  onClick={() => handleSaveEdit(order._id)}
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  className="order-management__cancel-button"
                                  onClick={handleCancelEdit}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="order-management__edit-button"
                                onClick={() => handleEditClick(order)}
                              >
                                수정
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="order-management__pagination">
                    <button
                      type="button"
                      className="order-management__pagination-button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </button>
                    <span className="order-management__pagination-info">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="order-management__pagination-button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

