import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 카테고리 및 가격 필터는 미구현으로 인해 import 주석 처리
// import {
//   CATEGORY_LINKS,
//   PRICE_FILTERS
// } from '../constants/homeData';
import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // 모든 상품 저장
  const [selectedGeneration, setSelectedGeneration] = useState('Z세대'); // 선택된 세대
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 선택된 세대에 따라 상품 필터링
  const products = allProducts.filter(product => {
    const matches = !selectedGeneration || product.generation === selectedGeneration;
    return matches;
  });

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setLoading(false);
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
        } else {
          clearSession();
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [API_URL]);

  // 모든 상품 가져오기
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        setProductsLoading(true);
        const allProducts = [];
        let currentPage = 1;
        let hasMore = true;

        // 모든 페이지를 순회하면서 상품 가져오기
        while (hasMore) {
          const res = await fetch(`${API_URL}/api/products?page=${currentPage}`);
          
          if (res.ok) {
            const data = await res.json();
            
            if (data.products && Array.isArray(data.products)) {
              allProducts.push(...data.products);
              // 다음 페이지가 있으면 계속, 없으면 중단
              hasMore = data.pagination?.hasNextPage || false;
              currentPage++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        setAllProducts(allProducts);
      } catch (error) {
        console.error('상품 목록 가져오기 실패:', error);
      } finally {
        setProductsLoading(false);
      }
    }

    fetchAllProducts();
  }, [API_URL]);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const handleLogout = () => {
    clearSession();
  };

  const handleAdmin = () => {
    if (user?.userType === 'admin') {
      navigate('/admin');
    } else {
      alert('관리자만 접근할 수 있습니다.');
    }
  };

  const handleGenerationChange = (generation) => {
    setSelectedGeneration(generation);
  };

  if (loading || productsLoading) {
    return (
      <div className="app">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onAdmin={handleAdmin}
        selectedGeneration={selectedGeneration}
        onGenerationChange={handleGenerationChange}
      />
      <main className="main">
        <section className={`hero hero--${selectedGeneration === 'M세대' ? 'm' : selectedGeneration === '영포티' ? 'youngforty' : 'z'}`}>
          <div className="hero__content">
            <div className="hero__text">
              <h2 className="hero__headline">세대별 트렌디 쇼핑</h2>
              <h1 className="hero__title">{selectedGeneration}</h1>
            </div>
            <p className="hero__description">
              {selectedGeneration === 'Z세대' && '빈티지부터 Y2K까지, 나만의 스타일로! 편안하고 개성있는 패션, 지금 만나보세요.'}
              {selectedGeneration === 'M세대' && '클래식과 모던의 조화, 세련된 스타일로! 당신만의 멋진 패션, 지금 만나보세요.'}
              {selectedGeneration === '영포티' && '젊은 감각과 품격의 만남! 트렌디하고 세련된 패션, 지금 만나보세요.'}
            </p>
          </div>
          <button type="button" className="hero__cta">
            지금 쇼핑하기
          </button>
        </section>

        <div className="content">
          {/* 카테고리 및 가격 필터는 미구현으로 인해 숨김 처리 */}
          {/* <aside className="sidebar">
            <div className="sidebar__section">
              <h3 className="sidebar__title">카테고리</h3>
              <ul className="sidebar__list">
                {CATEGORY_LINKS.map((category) => (
                  <li key={category}>
                    <button type="button" className="sidebar__item">
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar__section">
              <h3 className="sidebar__title">가격대</h3>
              <ul className="sidebar__list">
                {PRICE_FILTERS.map((filter) => (
                  <li key={filter.value}>
                    <label className="sidebar__checkbox">
                      <input type="checkbox" name="price" value={filter.value} />
                      <span>{filter.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside> */}

          <section className="products">
            <header className="products__header">
              <div>
                <h2 className="products__title">{selectedGeneration}</h2>
                <p className="products__subtitle">최신 트렌드의 패션 의류 · 총 {products.length}개</p>
              </div>
              {/* 정렬 기능은 미구현으로 인해 숨김 처리 */}
              {/* <button type="button" className="outline-button">
                신상품순
              </button> */}
            </header>

            <div className="products__grid">
              {products.length > 0 && products.map((product) => (
                  <article 
                    key={product._id} 
                    className="product"
                    onClick={() => navigate(`/products/${product._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product__image-wrapper">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="product__image"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f1f5f9" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지 없음%3C/text%3E%3C/svg%3E';
                        }}
                        loading="lazy"
                      />
                      {/* 찜하기 기능은 미구현으로 인해 숨김 처리 */}
                      {/* <button 
                        type="button" 
                        className="product__favorite" 
                        title="찜하기"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 찜하기 기능은 나중에 구현
                        }}
                      >
                        ♡
                      </button> */}
                      {product.generation && (
                        <span className={`product__tag product__tag--${product.generation === 'M세대' ? 'm' : product.generation === '영포티' ? 'youngforty' : 'z'}`}>
                          {product.generation}
                        </span>
                      )}
                    </div>
                    <div className="product__info">
                      <h3 className="product__name">{product.name}</h3>
                      <p className="product__price">₩{product.price.toLocaleString()}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

