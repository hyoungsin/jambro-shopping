import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Login() {
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const [currentUser, setCurrentUser] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    keepLoggedIn: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch (err) {
        console.error('저장된 사용자 정보 파싱 실패:', err)
      }
    }
  }, [])

  function updateField(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      })

      if (!res.ok && res.status === 0) {
        throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
      }

      const data = await res.json().catch(async (parseErr) => {
        console.error('JSON 파싱 에러:', parseErr)
        const text = await res.text()
        console.error('응답 텍스트:', text)
        throw new Error('서버 응답을 읽을 수 없습니다.')
      })

      if (!res.ok) {
        throw new Error(data.message || `로그인에 실패했습니다. (${res.status})`)
      }

      if (!data.token) {
        throw new Error('토큰을 받지 못했습니다.')
      }

      if (form.keepLoggedIn) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('user', JSON.stringify(data.user))
      }

      setCurrentUser(data.user)
      navigate('/', { replace: true })

      setTimeout(() => {
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar user={currentUser} />
      <div className="auth-container">
        <div className="auth-header">
          <h1>로그인</h1>
          <p>계정에 로그인하여 쇼핑을 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            <span>이메일</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="your@email.com"
              required
            />
          </label>

          <label className="auth-label">
            <span>비밀번호</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="비밀번호"
              required
            />
          </label>

          <div className="auth-keep">
            <label>
              <input
                type="checkbox"
                name="keepLoggedIn"
                checked={form.keepLoggedIn}
                onChange={updateField}
              />
              로그인 상태 유지
            </label>
            {/* 비밀번호 찾기 기능은 미구현으로 인해 숨김 처리 */}
            {/* <Link to="/forgot-password" className="auth-link--muted">
              비밀번호 찾기
            </Link> */}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={submitting} className="auth-submit">
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 소셜 로그인 기능은 미구현으로 인해 숨김 처리 */}
        {/* <div className="auth-divider">
          <span>또는</span>
        </div>

        <div className="auth-socials">
          <button type="button" disabled>
            <span className="auth-social-icon" style={{ color: '#4285f4' }}>G</span>
            Google로 로그인
          </button>
          <button type="button" disabled>
            <span className="auth-social-icon" style={{ color: '#1877f2' }}>f</span>
            Facebook으로 로그인
          </button>
          <button type="button" disabled>
            <span className="auth-social-icon">🍎</span>
            Apple로 로그인
          </button>
        </div> */}

        <p className="auth-switch">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="auth-link">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

