export const ADMIN_STATS = [
  {
    id: 'orders',
    label: '총 주문',
    value: '1,234',
    change: '+12% from last month',
    icon: '🛒'
  },
  {
    id: 'products',
    label: '총 상품',
    value: '156',
    change: '+3% from last month',
    icon: '📦'
  },
  {
    id: 'customers',
    label: '총 고객',
    value: '2,345',
    change: '+8% from last month',
    icon: '👥'
  },
  {
    id: 'sales',
    label: '총 매출',
    value: '$45,678',
    change: '+15% from last month',
    icon: '📈'
  }
];

export const ADMIN_ACTIONS = [
  { id: 'product-management', label: '상품 관리', accent: true },
  { id: 'new-product', label: '새 상품 등록', accent: true },
  { id: 'orders', label: '주문 관리' },
  { id: 'analytics', label: '매출 분석' },
  { id: 'customers', label: '고객 관리' }
];

export const RECENT_ORDERS = [
  { orderId: 'ORD-001234', customer: '김민수', date: '2024-12-30', amount: '$219', status: '처리중' },
  { orderId: 'ORD-001233', customer: '이영희', date: '2024-12-29', amount: '$156', status: '배송중' },
  { orderId: 'ORD-001232', customer: '박철수', date: '2024-12-28', amount: '$312', status: '완료' },
  { orderId: 'ORD-001231', customer: '최지은', date: '2024-12-27', amount: '$98', status: '환불' }
];
