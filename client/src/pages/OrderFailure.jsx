import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function OrderFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('주문 처리 중 오류가 발생했습니다.');

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
    
    // location.state에서 에러 메시지 가져오기
    if (location.state?.errorMessage) {
      setErrorMessage(location.state.errorMessage);
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
        <div className="order-failure">
          <div className="order-failure__container">
            {/* 울고 있는 이모지/이미지 */}
            <div className="order-failure__image-container">
              <div className="order-failure__crying-face">
                <div className="order-failure__face">
                  <div className="order-failure__eye order-failure__eye--left">
                    <div className="order-failure__tear order-failure__tear--left"></div>
                    <div className="order-failure__tear order-failure__tear--left-2"></div>
                  </div>
                  <div className="order-failure__eye order-failure__eye--right">
                    <div className="order-failure__tear order-failure__tear--right"></div>
                    <div className="order-failure__tear order-failure__tear--right-2"></div>
                  </div>
                  <div className="order-failure__mouth"></div>
                  <div className="order-failure__cheek order-failure__cheek--left"></div>
                  <div className="order-failure__cheek order-failure__cheek--right"></div>
                </div>
              </div>
            </div>

            {/* 실패 메시지 */}
            <div className="order-failure__message">
              <h2 className="order-failure__title">주문 처리에 실패했습니다</h2>
              <p className="order-failure__description">
                {errorMessage}
              </p>
              <p className="order-failure__help-text">
                문제가 계속되면 고객센터로 문의해주세요.
              </p>
            </div>

            {/* 버튼 */}
            <div className="order-failure__actions">
              <button
                type="button"
                className="primary-button order-failure__button"
                onClick={() => navigate('/checkout')}
              >
                다시 시도하기
              </button>
              <button
                type="button"
                className="outline-button order-failure__button"
                onClick={() => navigate('/cart')}
              >
                장바구니로 돌아가기
              </button>
              <button
                type="button"
                className="outline-button order-failure__button"
                onClick={() => navigate('/')}
              >
                홈으로 가기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

