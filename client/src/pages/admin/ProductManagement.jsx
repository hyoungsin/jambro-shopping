/**
 * 상품 관리 페이지
 * 상품 목록 조회, 검색, 필터링, 편집, 삭제 기능을 제공합니다.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function ProductManagement() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' 또는 'register'
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // 사용자 정보 가져오기
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

  // 상품 목록 가져오기
  useEffect(() => {
    async function fetchProducts() {
      if (!user || user.userType !== 'admin') {
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/products?page=${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          // 새로운 API 응답 형식: { products: [...], pagination: {...} }
          if (data.products && Array.isArray(data.products)) {
            setProducts(data.products);
            setPagination(data.pagination || pagination);
          } else {
            // 이전 형식 호환성 (배열 직접 반환)
            setProducts(Array.isArray(data) ? data : []);
          }
        } else {
          console.error('상품 목록 가져오기 실패:', res.status);
        }
      } catch (error) {
        console.error('상품 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [API_URL, user, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      setSearchTerm(''); // 페이지 변경 시 검색어 초기화
    }
  };

  // 상품 삭제
  const handleDelete = async (productId) => {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        // 목록에서 삭제된 상품 제거
        setProducts(products.filter(p => p._id !== productId));
        alert('상품이 삭제되었습니다.');
      } else {
        const error = await res.json();
        alert(error.message || '상품 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  // 검색 필터링된 상품 목록
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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
      <main className="product-management">
        {/* 헤더 */}
        <header className="product-management__header">
          <div className="product-management__header-left">
            <button
              type="button"
              className="back-button"
              onClick={() => navigate('/admin')}
              aria-label="뒤로 가기"
            >
              ←
            </button>
            <h1>상품 관리</h1>
          </div>
          <button
            type="button"
            className="new-product-button"
            onClick={() => navigate('/admin/products/register')}
          >
            <span>+</span> 새 상품 등록
          </button>
        </header>

        {/* 탭 */}
        <div className="product-management__tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'list' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            상품 목록
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'register' ? 'tab--active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              navigate('/admin/products/register');
            }}
          >
            상품 등록
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="product-management__search">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="button" className="filter-button">
            <span>⚙️</span> 필터
          </button>
        </div>

        {/* 상품 목록 테이블 */}
        <div className="product-management__table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="image-placeholder">이미지 없음</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-description">{product.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="product-category">{product.category}</span>
                    </td>
                    <td>
                      <div className="product-price">
                        <strong>₩{product.price.toLocaleString()}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="product-actions">
                        {/* 편집 기능은 미구현으로 인해 숨김 처리 */}
                        {/* <button
                          type="button"
                          className="edit-button"
                          onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                          title="편집"
                        >
                          ✏️
                        </button> */}
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDelete(product._id)}
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="product-management__pagination">
            <button
              type="button"
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              aria-label="이전 페이지"
            >
              ← 이전
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                // 현재 페이지 주변 2개씩만 표시
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-page ${currentPage === pageNum ? 'pagination-page--active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              type="button"
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              aria-label="다음 페이지"
            >
              다음 →
            </button>
          </div>
        )}

        {/* 페이지 정보 */}
        {pagination.total > 0 && (
          <div className="product-management__info">
            <span>
              전체 {pagination.total}개 중 {((currentPage - 1) * 2) + 1}-
              {Math.min(currentPage * 2, pagination.total)}개 표시
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

