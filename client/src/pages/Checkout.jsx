import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment' | 'complete'
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 배송 방법
  const [shippingMethod, setShippingMethod] = useState('address'); // 'address' or 'store'

  // 주소 정보
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    deliveryRequest: ''
  });

  // 결제 수단
  const [paymentMethod, setPaymentMethod] = useState('card');

  // 결제 정보
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardHolder: '',
    bankName: '',
    accountNumber: ''
  });

  // 동의 체크박스
  const [agreeShippingInfo, setAgreeShippingInfo] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  // 금액 계산
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = shippingMethod === 'store' || totalAmount >= 30000 ? 0 : 3000;
  const discountAmount = 0;
  const finalAmount = totalAmount + shippingFee - discountAmount;
  const vat = Math.floor(finalAmount / 11);

  // 포트원 결제 모듈 초기화
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp52872386'); // 고객 식별 코드
    }
  }, []);

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
          
          // 사용자 정보로 기본값 설정
          if (userData.name) {
            setAddress(prev => ({
              ...prev,
              fullName: userData.name,
              phone: userData.phone || ''
            }));
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
          if (data.cartItems && data.cartItems.length > 0) {
            setCartItems(data.cartItems);
          } else {
            alert('장바구니가 비어있습니다.');
            navigate('/cart');
          }
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
  }, [user, API_URL, navigate]);

  const handleAddressChange = (field, value) => {
    // 전화번호 필드인 경우 자동 포맷팅
    if (field === 'phone') {
      // 숫자만 추출
      const numbers = value.replace(/[^\d]/g, '');
      
      // 전화번호 자동 포맷팅 (010-XXXX-XXXX 형식)
      let formatted = numbers;
      if (numbers.length > 3 && numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length > 7 && numbers.length <= 11) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      } else if (numbers.length > 11) {
        // 11자리 초과 시 자르기
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
      
      setAddress(prev => ({ ...prev, [field]: formatted }));
    } else {
      setAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePaymentInfoChange = (field, value) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  // 배송지 입력 완료 처리
  const handleShippingSubmit = (e) => {
    e.preventDefault();

    // 매장 배송인 경우 주소 입력 없이 다음 단계로
    if (shippingMethod === 'store') {
      setStep('payment');
      return;
    }

    // 필수 필드 검증
    if (!address.fullName || !address.phone || !address.address || !address.addressDetail) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!agreeShippingInfo) {
      alert('배송정보 수집 및 이용에 동의해주세요.');
      return;
    }

    // 결제정보 입력 단계로 이동
    setStep('payment');
  };

  // 포트원 결제 요청
  const requestPayment = (orderData) => {
    if (!window.IMP) {
      alert('결제 모듈을 불러올 수 없습니다.');
      setSubmitting(false);
      return;
    }

    const merchantUid = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const buyerName = shippingMethod === 'store' 
      ? (user?.name || '고객')
      : address.fullName;
    const buyerTel = address.phone || user?.phone || '';
    const buyerEmail = user?.email || '';
    const buyerAddr = shippingMethod === 'store' 
      ? '매장 픽업'
      : `${address.address} ${address.addressDetail}`;
    const buyerPostcode = address.postalCode || '';

    // 상품명 생성
    const productName = cartItems.length === 1 
      ? cartItems[0].product.name 
      : `${cartItems[0].product.name} 외 ${cartItems.length - 1}개`;

    // 결제 수단에 따른 포트원 설정
    // 포트원 관리자에서 html5_inicis PG가 설정되어 있음
    let paymentData = {
      pg: 'html5_inicis',
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: productName,
      amount: finalAmount,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      buyer_tel: buyerTel,
      buyer_addr: buyerAddr,
      buyer_postcode: buyerPostcode,
      m_redirect_url: `${window.location.origin}/checkout`
    };

    // 결제 수단별 설정
    if (paymentMethod === 'card') {
      paymentData.pg = 'html5_inicis';
      paymentData.pay_method = 'card';
    } else if (paymentMethod === 'bank') {
      paymentData.pg = 'html5_inicis';
      paymentData.pay_method = 'trans';
    } else if (paymentMethod === 'kakao') {
      // 카카오페이: 포트원 관리자에서 카카오페이 PG를 설정해야 함
      paymentData.pg = 'kakaopay';
      paymentData.pay_method = 'card';
    } else if (paymentMethod === 'toss') {
      // 토스페이: 포트원 관리자에서 토스페이 PG를 설정해야 함
      paymentData.pg = 'tosspay';
      paymentData.pay_method = 'card';
    }

    // 포트원 결제 요청
    window.IMP.request_pay(paymentData, async (rsp) => {
      if (rsp.success) {
        // 결제 성공 시 주문 생성
        await createOrder(orderData, merchantUid, rsp);
      } else {
        // 결제 실패
        let errorMessage = rsp.error_msg || '결제에 실패했습니다.';
        
        // 카카오페이/토스페이 PG 설정 오류인 경우 안내 메시지 추가
        if (rsp.error_msg && rsp.error_msg.includes('pg 파라미터')) {
          if (paymentMethod === 'kakao') {
            errorMessage = '카카오페이 PG가 설정되지 않았습니다. 포트원 관리자에서 카카오페이 PG를 설정해주세요.';
          } else if (paymentMethod === 'toss') {
            errorMessage = '토스페이 PG가 설정되지 않았습니다. 포트원 관리자에서 토스페이 PG를 설정해주세요.';
          }
        }
        
        // 주문 실패 페이지로 이동
        navigate('/order/failure', {
          state: { errorMessage: `결제에 실패했습니다. ${errorMessage}` }
        });
        setSubmitting(false);
      }
    });
  };

  // 주문 생성 함수
  const createOrder = async (orderData, merchantUid, paymentResponse) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...orderData,
          payment: {
            ...orderData.payment,
            merchantUid: merchantUid,
            impUid: paymentResponse.imp_uid
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        // 주문 성공 페이지로 이동 (주문 정보 전달)
        navigate('/order/success', {
          state: { order: data.order }
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        // 주문 실패 페이지로 이동 (에러 메시지 전달)
        navigate('/order/failure', {
          state: { errorMessage: errorData.message || '주문 생성에 실패했습니다.' }
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error('주문 생성 실패:', error);
      // 주문 실패 페이지로 이동
      navigate('/order/failure', {
        state: { errorMessage: '주문 생성에 실패했습니다.' }
      });
      setSubmitting(false);
    }
  };

  // 결제정보 입력 완료 및 주문 생성
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('주문할 상품이 없습니다.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const cartItemIds = cartItems.map(item => item._id);

      // 매장 배송인 경우 주소 정보 없이 주문 생성
      const shippingAddressData = shippingMethod === 'store' ? {
        recipientName: user?.name || '고객',
        phone: address.phone || user?.phone || '',
        address: '매장 픽업',
        addressDetail: '',
        postalCode: '',
        deliveryRequest: '매장 픽업'
      } : {
        recipientName: address.fullName,
        phone: address.phone,
        address: address.address,
        addressDetail: address.addressDetail,
        postalCode: address.postalCode,
        deliveryRequest: address.deliveryRequest
      };

      const orderData = {
        cartItemIds,
        shippingAddress: shippingAddressData,
        payment: {
          method: paymentMethod
        },
        shippingFee,
        discountAmount,
        orderNote: address.deliveryRequest || '매장 픽업'
      };

      // 포트원 결제 요청
      requestPayment(orderData);
    } catch (error) {
      console.error('결제 준비 실패:', error);
      alert('결제 준비에 실패했습니다.');
      setSubmitting(false);
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
        <div className="checkout">
          <h1 className="checkout__title">결제하기</h1>
          
          {/* 주문 처리 단계 표시 */}
          <div className="checkout__steps">
            <div className={`checkout__step ${step === 'shipping' ? 'active' : step === 'payment' || step === 'complete' ? 'completed' : ''}`}>
              <div className="checkout__step-number">①</div>
              <div className="checkout__step-label">배송지 입력</div>
            </div>
            <div className={`checkout__step-line ${step === 'payment' || step === 'complete' ? 'completed' : ''}`}></div>
            <div className={`checkout__step ${step === 'payment' ? 'active' : step === 'complete' ? 'completed' : ''}`}>
              <div className="checkout__step-number">②</div>
              <div className="checkout__step-label">결제정보입력</div>
            </div>
            <div className={`checkout__step-line ${step === 'complete' ? 'completed' : ''}`}></div>
            <div className={`checkout__step ${step === 'complete' ? 'active' : ''}`}>
              <div className="checkout__step-number">③</div>
              <div className="checkout__step-label">주문완료</div>
            </div>
          </div>
          
          <div className="checkout__free-shipping-note">
            무료 배송 대상 (30,000원 이상 구매 또는 [매장으로 배송] 선택시)
          </div>

          <div className="checkout__content">
            {/* 왼쪽: 배송 정보 및 결제 수단 */}
            <div className="checkout__form-section">
              {/* ① 배송지 입력 단계 */}
              {step === 'shipping' && (
                <>
                  {/* 배송 방법 선택 */}
                  <section className="checkout__section">
                    <h2 className="checkout__section-title">1. 배송 방법</h2>
                    <div className="checkout__shipping-methods">
                      <button
                        type="button"
                        className={`checkout__shipping-method ${shippingMethod === 'address' ? 'active' : ''}`}
                        onClick={() => setShippingMethod('address')}
                      >
                        <div className="checkout__shipping-method-content">
                          <strong>지정 주소로 배송</strong>
                          <span>배송비: {shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`checkout__shipping-method ${shippingMethod === 'store' ? 'active' : ''}`}
                        onClick={() => setShippingMethod('store')}
                      >
                        <div className="checkout__shipping-method-content">
                          <strong>매장으로 배송</strong>
                          <span>배송비: 무료</span>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* 주소 등록 */}
                  {shippingMethod === 'address' && (
                    <section className="checkout__section">
                      <div className="checkout__section-header">
                        <h2 className="checkout__section-title">새로운 주소 등록하기</h2>
                        <span className="checkout__required-note">필수 항목 ※</span>
                      </div>
                      
                      <p className="checkout__address-note">
                        배송 주소를 확인하세요. 주소가 정확하지 않으면 주문이 취소되거나, 지연될 수 있습니다.
                      </p>

                      <form onSubmit={handleShippingSubmit} className="checkout__address-form">
                        <div className="checkout__form-group">
                          <label className="checkout__label">
                            성명 <span className="checkout__required">※</span>
                          </label>
                          <input
                            type="text"
                            className="checkout__input"
                            value={address.fullName}
                            onChange={(e) => handleAddressChange('fullName', e.target.value)}
                            placeholder="홍길동"
                            required
                          />
                        </div>

                        <div className="checkout__form-group">
                          <label className="checkout__label">
                            전화번호 <span className="checkout__required">※</span>
                          </label>
                          <input
                            type="tel"
                            className="checkout__input"
                            value={address.phone}
                            onChange={(e) => handleAddressChange('phone', e.target.value)}
                            placeholder="010-1234-5678"
                            required
                          />
                          <small className="checkout__help-text">
                            회원정보에 오기임이 없는지 다시 한번 확인해주세요.
                          </small>
                        </div>

                        <div className="checkout__form-group">
                          <label className="checkout__label">
                            주소 열 1
                          </label>
                          <div className="checkout__address-search">
                            <input
                              type="text"
                              className="checkout__input"
                              value={address.address}
                              onChange={(e) => handleAddressChange('address', e.target.value)}
                              placeholder="주소를 입력하세요"
                              required
                            />
                            <button type="button" className="checkout__search-button">
                              재검색
                            </button>
                          </div>
                        </div>

                        <div className="checkout__form-group">
                          <label className="checkout__label">
                            상세 주소 <span className="checkout__required">※</span>
                          </label>
                          <input
                            type="text"
                            className="checkout__input"
                            value={address.addressDetail}
                            onChange={(e) => handleAddressChange('addressDetail', e.target.value)}
                            placeholder="상세주소(건물명 / 호)"
                            required
                          />
                        </div>

                        <div className="checkout__form-group">
                          <label className="checkout__checkbox-label">
                            <input
                              type="checkbox"
                              checked={agreeShippingInfo}
                              onChange={(e) => setAgreeShippingInfo(e.target.checked)}
                              required
                            />
                            <span>
                              배송정보 수집 및 이용에 동의 합니다. <span className="checkout__required">※</span>
                            </span>
                            <a href="#" className="checkout__link">상세 보기</a>
                          </label>
                        </div>

                        <div className="checkout__form-group">
                          <label className="checkout__checkbox-label">
                            <input
                              type="checkbox"
                              checked={setAsDefault}
                              onChange={(e) => setSetAsDefault(e.target.checked)}
                            />
                            <span>내 기본 배송 주소로 설정</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="checkout__submit-button"
                        >
                          다음 단계
                        </button>
                      </form>
                    </section>
                  )}

                  {/* 매장 배송 선택 시 다음 단계 버튼 */}
                  {shippingMethod === 'store' && (
                    <section className="checkout__section">
                      <div className="checkout__store-delivery-note">
                        <p>매장으로 배송을 선택하셨습니다.</p>
                        <p>결제 정보 입력 단계로 진행하시겠습니까?</p>
                      </div>
                      <button
                        type="button"
                        className="checkout__submit-button"
                        onClick={() => setStep('payment')}
                      >
                        다음 단계
                      </button>
                    </section>
                  )}
                </>
              )}

              {/* ② 결제정보 입력 단계 */}
              {step === 'payment' && (
                <>
                  <section className="checkout__section">
                    <h2 className="checkout__section-title">2. 결제 수단 선택</h2>
                    <div className="checkout__payment-methods">
                      <label className="checkout__payment-method">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>신용카드</span>
                      </label>
                      <label className="checkout__payment-method">
                        <input
                          type="radio"
                          name="payment"
                          value="bank"
                          checked={paymentMethod === 'bank'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>무통장 입금</span>
                      </label>
                      <label className="checkout__payment-method">
                        <input
                          type="radio"
                          name="payment"
                          value="kakao"
                          checked={paymentMethod === 'kakao'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>카카오페이</span>
                      </label>
                      <label className="checkout__payment-method">
                        <input
                          type="radio"
                          name="payment"
                          value="toss"
                          checked={paymentMethod === 'toss'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span>토스페이</span>
                      </label>
                    </div>
                  </section>

                  {/* 결제 진행 안내 */}
                  <section className="checkout__section">
                    <div className="checkout__payment-info-note">
                      <p>결제 수단을 선택하신 후 "주문 완료" 버튼을 클릭하시면</p>
                      <p>이니시스 결제 창에서 결제 정보를 입력하실 수 있습니다.</p>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="checkout__payment-form">
                      <div className="checkout__form-actions">
                        <button
                          type="button"
                          className="checkout__back-button"
                          onClick={() => setStep('shipping')}
                        >
                          이전 단계
                        </button>
                        <button
                          type="submit"
                          className="checkout__submit-button"
                          disabled={submitting}
                        >
                          {submitting ? '결제 진행 중...' : '주문 완료'}
                        </button>
                      </div>
                    </form>
                  </section>
                </>
              )}
            </div>

            {/* 오른쪽: 주문 상세내역 */}
            <aside className="checkout__summary">
              <div className="checkout__summary-card">
                <h3 className="checkout__summary-title">주문 상세내역</h3>
                
                <div className="checkout__summary-item">
                  <span>{cartItems.length} 제품</span>
                </div>

                <div className="checkout__summary-row">
                  <span>제품 합계</span>
                  <span>₩{totalAmount.toLocaleString()}</span>
                </div>

                <div className="checkout__summary-row">
                  <span>배송비</span>
                  <span>{shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}</span>
                </div>

                <div className="checkout__summary-row checkout__summary-row--total">
                  <span>총 결제 금액</span>
                  <span>₩{finalAmount.toLocaleString()}</span>
                </div>

                <div className="checkout__summary-row">
                  <span>세금(VAT)</span>
                  <span>₩{vat.toLocaleString()}</span>
                </div>

                <div className="checkout__summary-coupon">
                  <span>쿠폰 (0)</span>
                  <span>→</span>
                </div>
              </div>

              <div className="checkout__help-card">
                <div className="checkout__help-icon">💬</div>
                <p>구매에 어려움이 있으신가요? 챗봇이 대답해 드립니다.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

