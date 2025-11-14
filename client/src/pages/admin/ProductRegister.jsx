import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const CATEGORIES = ['T셔츠', '하의', '겹겹이', '내의', '악세서리'];
const GENERATIONS = ['Z세대', 'M세대', '영포티'];

export default function ProductRegister() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    generation: '',
    image: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // 이미지 URL이 변경될 때마다 미리보기 업데이트
  useEffect(() => {
    setImagePreview(form.image);
  }, [form.image]);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openCloudinaryWidget() {
    if (!window.cloudinary) {
      setError('Cloudinary 위젯을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        showAdvancedOptions: false,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#0078FF',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#0078FF',
            action: '#FF620C',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#0078FF',
            complete: '#20B832',
            sourceBg: '#E4EBF1'
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: 'https://fonts.googleapis.com/css?family=Poppins',
              active: true
            }
          }
        }
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary 업로드 에러:', error);
          setError('이미지 업로드에 실패했습니다.');
          return;
        }

        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          setForm((prev) => ({ ...prev, image: imageUrl }));
          setImagePreview(imageUrl);
          setError('');
        }
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 필수 필드 검증
    if (!form.sku || !form.name || !form.price || !form.category || !form.generation || !form.image) {
      setError('SKU, 상품이름, 가격, 카테고리, 세대, 이미지는 필수입니다.');
      return;
    }

    // 가격 유효성 검증
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('가격은 0 이상의 숫자여야 합니다.');
      return;
    }

    // 토큰 가져오기
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('로그인이 필요합니다.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          price: priceNum,
          category: form.category,
          generation: form.generation,
          image: form.image,
          description: form.description || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || '상품 등록에 실패했습니다.');
      }

      const productData = await res.json();
      setSuccess('상품이 성공적으로 등록되었습니다.');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page">
      <Navbar />
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>새 상품 등록</h1>
            <p>새로운 상품을 등록하세요.</p>
          </div>
          <button type="button" className="outline-button" onClick={() => navigate('/admin')}>
            대시보드로 돌아가기
          </button>
        </header>

        <div className="admin-panel" style={{ maxWidth: 800 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  SKU (상품ID) <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <input
                  name="sku"
                  type="text"
                  value={form.sku}
                  onChange={updateField}
                  placeholder="예: PROD-001"
                  required
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <small style={{ color: '#64748b', fontSize: 13 }}>
                  고유한 상품 식별자입니다. 중복될 수 없습니다.
                </small>
              </label>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  상품이름 <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={updateField}
                  placeholder="상품 이름을 입력하세요"
                  required
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    상품가격 (원) <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={updateField}
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 15,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </label>

                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    카테고리 <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 15,
                      outline: 'none',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">카테고리 선택</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  세대 <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <select
                  name="generation"
                  value={form.generation}
                  onChange={updateField}
                  required
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">세대 선택</option>
                  {GENERATIONS.map((gen) => (
                    <option key={gen} value={gen}>
                      {gen}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#64748b', fontSize: 13 }}>
                  이 상품이 타겟하는 세대를 선택하세요.
                </small>
              </label>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  이미지 <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    type="button"
                    onClick={openCloudinaryWidget}
                    style={{
                      padding: '12px 24px',
                      border: '2px dashed #cbd5e1',
                      borderRadius: 12,
                      background: '#f8fafc',
                      color: '#475569',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.background = '#eff6ff';
                      e.target.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.background = '#f8fafc';
                      e.target.style.color = '#475569';
                    }}
                  >
                    <span>📷</span>
                    <span>{form.image ? '이미지 변경하기' : '이미지 업로드하기'}</span>
                  </button>

                  {imagePreview && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        background: '#fff'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="상품 미리보기"
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, image: '' }));
                          setImagePreview('');
                        }}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          padding: '6px 12px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(220, 38, 38, 0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}

                  {form.image && (
                    <input
                      name="image"
                      type="hidden"
                      value={form.image}
                      required
                    />
                  )}

                  <small style={{ color: '#64748b', fontSize: 13 }}>
                    Cloudinary 위젯을 통해 이미지를 업로드하거나, 직접 URL을 입력할 수 있습니다.
                  </small>

                  <input
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={updateField}
                    placeholder="또는 이미지 URL을 직접 입력하세요"
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 15,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </label>

              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  설명
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="상품에 대한 설명을 입력하세요 (선택사항)"
                  rows={4}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </label>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: 12,
                  fontSize: 14
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#d1fae5',
                  color: '#059669',
                  borderRadius: 12,
                  fontSize: 14
                }}
              >
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  background: '#fff',
                  color: '#475569',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#fff';
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 12,
                  background: submitting ? '#94a3b8' : '#0f172a',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {submitting ? '등록 중...' : '상품 등록'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

