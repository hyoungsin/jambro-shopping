import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import secondaryLogo from '../assets/logo-secondary.svg';
import { NAV_LINKS } from '../constants/homeData';

export default function Navbar({ 
  user, 
  onLogout = () => {}, 
  onAdmin = () => {},
  selectedGeneration,
  onGenerationChange
}) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 장바구니 개수 가져오기
  useEffect(() => {
    async function fetchCartCount() {
      if (!user) {
        setCartCount(0);
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setCartCount(0);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/carts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCartCount(data.totalItems || 0);
        }
      } catch (error) {
        console.error('장바구니 개수 가져오기 실패:', error);
      }
    }

    fetchCartCount();
  }, [user, API_URL]);

  const handleCartClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/cart');
  };

  return (
    <header className="navbar">
      <div className="navbar__logo" onClick={() => navigate('/')}>
        <div className="navbar__text">
          <span className="navbar__brand">Jambro Shopping</span>
          <span className="navbar__tagline">Trendy Fashion for you</span>
        </div>
        <img src={secondaryLogo} alt="Shopping bag illustration" className="navbar__badge" />
      </div>

      {selectedGeneration && onGenerationChange && (
        <nav className="navbar__links">
          {NAV_LINKS.map((item) => (
            <button 
              key={item} 
              type="button" 
              className={`navbar__link ${item === 'M세대' ? 'navbar__link--m' : item === '영포티' ? 'navbar__link--youngforty' : ''} ${selectedGeneration === item ? 'navbar__link--active' : ''}`}
              onClick={() => onGenerationChange(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      )}

      <div className="navbar__actions">
        <button type="button" className="icon-button" title="검색">
          🔍
        </button>
        {user ? (
          <>
            {user.userType === 'admin' && (
              <button type="button" className="outline-button" onClick={onAdmin}>
                어드민
              </button>
            )}
            <button 
              type="button" 
              className="outline-button" 
              onClick={() => navigate('/orders')}
              title="주문 목록"
            >
              주문 목록
            </button>
            <span className="navbar__welcome">
              <strong>{user.name}</strong>님 환영합니다.
            </span>
            <button type="button" className="outline-button navbar__logout-button" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <div className="navbar__auth">
            <button type="button" className="primary-button" onClick={() => navigate('/login')}>
              로그인
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate('/signup')}>
              회원가입
            </button>
          </div>
        )}
        <button 
          type="button" 
          className="icon-button navbar__cart-button" 
          title="장바구니"
          onClick={handleCartClick}
        >
          🛒
          {cartCount > 0 && (
            <span className="navbar__cart-badge">{cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

