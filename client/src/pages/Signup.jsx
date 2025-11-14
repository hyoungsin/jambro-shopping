import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // address, userType removed from UI; userType defaults to 'customer' server-side
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.email || !form.password) {
      setError('이름, 이메일, 비밀번호는 필수입니다.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          // do not send userType/address; server defaults userType to 'customer'
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || '회원가입에 실패했습니다.')
      }
      setSuccess('회원가입이 완료되었습니다.')
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>회원가입</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>새로운 계정을 만들어 쇼핑을 시작해요.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>이름</span>
          <input name="name" value={form.name} onChange={updateField} placeholder="이름" required />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>이메일</span>
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="your@email.com" required />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>비밀번호</span>
          <input name="password" type="password" value={form.password} onChange={updateField} placeholder="비밀번호" required />
          <small style={{ color: '#888' }}>8자 이상, 영문/숫자/특수문자 포함 권장</small>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>비밀번호 확인</span>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} placeholder="비밀번호를 다시 입력" required />
        </label>

        {/* 주소, 유저 타입 입력 제거 (userType은 서버 기본값 customer 사용) */}

        {error && <div style={{ color: '#d33' }}>{error}</div>}
        {success && <div style={{ color: '#0a7' }}>{success}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {submitting ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  )
}


