import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Cart() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
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
    async function fetchCart() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !user) {
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/carts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCartItems(data.cartItems || []);
          setTotalPrice(data.totalPrice || 0);
        }
      } catch (error) {
        console.error('장바구니 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCart();
    }
  }, [user, API_URL]);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/carts/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (res.ok) {
        // 장바구니 다시 불러오기
        const cartRes = await fetch(`${API_URL}/api/carts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (cartRes.ok) {
          const data = await cartRes.json();
          setCartItems(data.cartItems || []);
          setTotalPrice(data.totalPrice || 0);
        }
      }
    } catch (error) {
      console.error('수량 변경 실패:', error);
    }
  };

  const handleDelete = async (cartItemId) => {
    if (!confirm('정말 이 상품을 장바구니에서 제거하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/carts/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        // 장바구니 다시 불러오기
        const cartRes = await fetch(`${API_URL}/api/carts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (cartRes.ok) {
          const data = await cartRes.json();
          setCartItems(data.cartItems || []);
          setTotalPrice(data.totalPrice || 0);
        }
      }
    } catch (error) {
      console.error('장바구니 아이템 삭제 실패:', error);
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
        <div className="cart">
          <h1 className="cart__title">장바구니</h1>

          {cartItems.length === 0 ? (
            <div className="cart__empty">
              <p>장바구니가 비어있습니다.</p>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => navigate('/')}
              >
                쇼핑하러 가기
              </button>
            </div>
          ) : (
            <>
              <div className="cart__items">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item__image">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        onClick={() => navigate(`/products/${item.product._id}`)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <div className="cart-item__info">
                      <h3 className="cart-item__name">{item.product.name}</h3>
                      <div className="cart-item__details">
                        {item.size && <span>사이즈: {item.size}</span>}
                        {item.color && <span>색상: {item.color}</span>}
                      </div>
                      <div className="cart-item__price">
                        ₩{(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <div className="cart-item__quantity">
                      <button
                        type="button"
                        className="cart-item__quantity-button"
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="cart-item__quantity-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-item__quantity-button"
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-item__delete"
                      onClick={() => handleDelete(item._id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart__summary">
                <div className="cart__total">
                  <span className="cart__total-label">총 결제금액</span>
                  <span className="cart__total-price">₩{totalPrice.toLocaleString()}</span>
                </div>
                <button 
                  type="button" 
                  className="cart__checkout-button"
                  onClick={() => navigate('/checkout')}
                >
                  주문하기
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

