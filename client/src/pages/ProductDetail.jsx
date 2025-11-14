import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = [
    { name: '네이비', value: '#1e293b' },
    { name: '블랙', value: '#000000' },
    { name: '화이트', value: '#ffffff' }
  ];

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
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
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    }

    fetchUser();
  }, [API_URL]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/products/${id}`);
        
        if (res.ok) {
          const productData = await res.json();
          setProduct(productData);
        } else {
          alert('상품을 찾을 수 없습니다.');
          navigate('/');
        }
      } catch (error) {
        console.error('상품 정보 가져오기 실패:', error);
        alert('상품 정보를 불러오는데 실패했습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id, API_URL, navigate]);

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToBag = async () => {
    if (!selectedSize) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    if (!selectedColor) {
      alert('색상을 선택해주세요.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product: product._id,
          quantity,
          size: selectedSize,
          color: selectedColor
        })
      });

      if (res.ok) {
        alert('장바구니에 추가되었습니다!');
        // 페이지 새로고침으로 Navbar의 장바구니 개수 업데이트
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || '장바구니에 추가하는데 실패했습니다.');
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니에 추가하는데 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
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
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onAdmin={handleAdmin}
      />
      
      <div className="product-detail">
        {/* 헤더 */}
        <header className="product-detail__header">
          <button 
            type="button" 
            className="product-detail__back"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <h1 className="product-detail__header-title">{product.name}</h1>
          <div className="product-detail__header-actions">
            {/* 공유 및 찜하기 기능은 미구현으로 인해 숨김 처리 */}
            {/* <button type="button" className="product-detail__icon-button" title="공유">
              📤
            </button>
            <button type="button" className="product-detail__icon-button" title="찜하기">
              ♡
            </button> */}
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="product-detail__content">
          {/* 왼쪽: 상품 이미지 */}
          <div className="product-detail__images">
            <div className="product-detail__main-image">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-detail__thumbnails">
              <div className="product-detail__thumbnail active">
                <img src={product.image} alt={product.name} />
              </div>
              {/* 추가 썸네일은 나중에 구현 */}
            </div>
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className="product-detail__info">
            {/* 태그 */}
            <div className="product-detail__tags">
              <span className="product-detail__tag product-detail__tag--new">NEW</span>
              {product.generation && (
                <span className={`product-detail__tag product-detail__tag--generation product-detail__tag--${product.generation === 'M세대' ? 'm' : product.generation === '영포티' ? 'youngforty' : 'z'}`}>
                  {product.generation}
                </span>
              )}
            </div>

            {/* 상품명 */}
            <h2 className="product-detail__name">{product.name}</h2>

            {/* 평점 */}
            <div className="product-detail__rating">
              <span className="product-detail__rating-stars">⭐ 4.8</span>
              <span className="product-detail__rating-reviews">(124 reviews)</span>
            </div>

            {/* 가격 */}
            <div className="product-detail__price">
              <span className="product-detail__price-current">₩{product.price.toLocaleString()}</span>
              <span className="product-detail__price-original">₩{(product.price * 1.35).toLocaleString()}</span>
              <span className="product-detail__price-discount">26% OFF</span>
            </div>

            {/* 설명 */}
            {product.description && (
              <p className="product-detail__description">{product.description}</p>
            )}

            {/* 사이즈 선택 */}
            <div className="product-detail__section">
              <label className="product-detail__label">Size</label>
              <div className="product-detail__size-buttons">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`product-detail__size-button ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 선택 */}
            <div className="product-detail__section">
              <label className="product-detail__label">Color:</label>
              <div className="product-detail__color-buttons">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`product-detail__color-button ${selectedColor === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="product-detail__section">
              <label className="product-detail__label">Quantity</label>
              <div className="product-detail__quantity">
                <button
                  type="button"
                  className="product-detail__quantity-button"
                  onClick={() => handleQuantityChange(-1)}
                >
                  -
                </button>
                <input
                  type="number"
                  className="product-detail__quantity-input"
                  value={quantity}
                  readOnly
                  min="1"
                  max="10"
                />
                <button
                  type="button"
                  className="product-detail__quantity-button"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
                <span className="product-detail__stock">Only 5 left in stock</span>
              </div>
            </div>

            {/* 장바구니 버튼 */}
            <button
              type="button"
              className="product-detail__add-to-bag"
              onClick={handleAddToBag}
            >
              🛒 ADD TO BAG - ₩{(product.price * quantity).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

