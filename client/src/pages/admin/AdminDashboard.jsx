import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ADMIN_ACTIONS } from '../../constants/adminData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    ordersChange: 0,
    productsChange: 0,
    customersChange: 0,
    salesChange: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

          if (localStorage.getItem('token')) {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }

          if (userData.userType !== 'admin') {
            alert('관리자만 접근할 수 있습니다.');
            navigate('/');
          }
        } else {
          redirectToLogin();
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        redirectToLogin();
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [API_URL, navigate]);

  useEffect(() => {
    async function fetchDashboardData() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !user || user.userType !== 'admin') {
        return;
      }

      try {
        // 통계 데이터 가져오기
        const statsRes = await fetch(`${API_URL}/api/orders/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        // 최근 주문 가져오기 (최근 5개)
        const ordersRes = await fetch(`${API_URL}/api/orders?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('대시보드 데이터 가져오기 실패:', error);
      }
    }

    if (user && user.userType === 'admin') {
      fetchDashboardData();
    }
  }, [user, API_URL]);

  const redirectToLogin = () => {
    clearSession();
    navigate('/login');
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={handleLogout} onAdmin={() => navigate('/admin')} />
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <div className="admin-header-icon">📊</div>
            <h1>관리자 대시보드</h1>
          </div>
          <button type="button" className="outline-button" onClick={() => navigate('/')}>쇼핑몰로 돌아가기</button>
        </header>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <div className="admin-stat-icon">🛒</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">총 주문</span>
              <strong className="admin-stat-value">{stats.totalOrders.toLocaleString()}</strong>
              <span className={`admin-stat-change ${stats.ordersChange >= 0 ? 'positive' : 'negative'}`}>
                {stats.ordersChange >= 0 ? '+' : ''}{stats.ordersChange}% 지난달 대비
              </span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-icon">📦</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">총 상품</span>
              <strong className="admin-stat-value">{stats.totalProducts.toLocaleString()}</strong>
              <span className={`admin-stat-change ${stats.productsChange >= 0 ? 'positive' : 'negative'}`}>
                {stats.productsChange >= 0 ? '+' : ''}{stats.productsChange}% 지난달 대비
              </span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">총 고객</span>
              <strong className="admin-stat-value">{stats.totalCustomers.toLocaleString()}</strong>
              <span className={`admin-stat-change ${stats.customersChange >= 0 ? 'positive' : 'negative'}`}>
                {stats.customersChange >= 0 ? '+' : ''}{stats.customersChange}% 지난달 대비
              </span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-icon">📈</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">총 매출</span>
              <strong className="admin-stat-value">₩{stats.totalSales.toLocaleString()}</strong>
              <span className={`admin-stat-change ${stats.salesChange >= 0 ? 'positive' : 'negative'}`}>
                {stats.salesChange >= 0 ? '+' : ''}{stats.salesChange}% 지난달 대비
              </span>
            </div>
          </article>
        </section>

        <section className="admin-content">
          <div className="admin-panel">
            <h2>작업</h2>
            <div className="admin-actions">
              {ADMIN_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={`admin-action ${action.accent ? 'admin-action--accent' : ''}`}
                  onClick={() => {
                    if (action.id === 'product-management') {
                      navigate('/admin/products');
                    } else if (action.id === 'new-product') {
                      navigate('/admin/products/register');
                    } else if (action.id === 'orders') {
                      navigate('/admin/orders');
                    }
                  }}
                >
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>최근 주문</h2>
              <button type="button" className="admin-link">
                전체보기
              </button>
            </div>
            <ul className="admin-orders">
              {recentOrders.length === 0 ? (
                <li className="admin-order-item">
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                    최근 주문이 없습니다.
                  </p>
                </li>
              ) : (
                recentOrders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  
                  const statusMap = {
                    'pending': '결제 대기',
                    'paid': '결제 완료',
                    'preparing': '배송 준비중',
                    'shipping': '배송중',
                    'delivered': '배송 완료',
                    'cancelled': '주문 취소',
                    'refunded': '환불 완료'
                  };

                  const paymentMethodMap = {
                    'card': '신용카드',
                    'bank': '무통장 입금',
                    'kakao': '카카오페이',
                    'toss': '토스페이',
                    'naver': '네이버페이'
                  };

                  return (
                    <li key={order._id} className="admin-order-item">
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <p>{order.user?.name || '고객'}</p>
                      </div>
                      <div className="admin-order-meta">
                        <span>{orderDate}</span>
                        <span className="admin-order-payment-method">
                          {paymentMethodMap[order.payment?.method] || order.payment?.method || '-'}
                        </span>
                        <span className="admin-order-status">{statusMap[order.status] || order.status}</span>
                        <span className="admin-order-amount">₩{order.finalAmount?.toLocaleString() || 0}</span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

