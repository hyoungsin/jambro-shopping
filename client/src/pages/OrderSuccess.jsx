import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
    
    // location.state에서 주문 정보 가져오기
    if (location.state?.order) {
      setOrderData(location.state.order);
    }
  }, [navigate, location]);

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

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} onAdmin={handleAdmin} />
      
      <main className="main">
        <div className="order-success">
          <div className="order-success__container">
            {/* 로고 이미지 영역 */}
            <div className="order-success__logo-container">
              <div className="order-success__logo-wrapper">
                {/* Jambro Shopping 로고 스타일 구현 */}
                <div className="order-success__logo">
                  <div className="order-success__shopping-bag">
                    <div className="order-success__bag-body"></div>
                    <div className="order-success__bag-handle order-success__bag-handle--left"></div>
                    <div className="order-success__bag-handle order-success__bag-handle--right"></div>
                    <div className="order-success__bag-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2"/>
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <h1 className="order-success__brand">Jambro Shopping</h1>
                <p className="order-success__tagline">Trendy Fashion for you</p>
              </div>
            </div>

            {/* 성공 메시지 */}
            <div className="order-success__message">
              <div className="order-success__icon">✓</div>
              <h2 className="order-success__title">주문이 완료되었습니다!</h2>
              <p className="order-success__description">
                주문해주셔서 감사합니다. 주문 내역은 주문 목록에서 확인하실 수 있습니다.
              </p>
            </div>

            {/* 주문 정보 */}
            {orderData && (
              <div className="order-success__info">
                <div className="order-success__info-row">
                  <span>주문번호</span>
                  <strong>{orderData.orderNumber}</strong>
                </div>
                <div className="order-success__info-row">
                  <span>결제 금액</span>
                  <strong>₩{orderData.finalAmount?.toLocaleString()}원</strong>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="order-success__actions">
              <button
                type="button"
                className="primary-button order-success__button"
                onClick={() => navigate('/orders')}
              >
                주문 내역 보기
              </button>
              <button
                type="button"
                className="outline-button order-success__button"
                onClick={() => navigate('/')}
              >
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

