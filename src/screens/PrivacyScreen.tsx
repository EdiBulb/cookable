import { Link } from 'react-router-dom'
import { BackIcon } from '../components/icons'

/** 개인정보처리방침 (구글 로그인 동의 화면에 필요) */
export function PrivacyScreen() {
  return (
    <main className="screen screen--plain privacy">
      <header className="header-row">
        <Link to="/settings" className="icon-btn icon-btn--ghost" aria-label="설정으로 돌아가기">
          <BackIcon />
        </Link>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          개인정보처리방침
        </h1>
      </header>
      <p className="subtitle">시행일: 2026년 11월 21일</p>

      <h2>1. 모으는 정보</h2>
      <p>로그인하지 않으면 아무 정보도 서버로 보내지 않아요. 모든 데이터는 이 기기의 브라우저에만 저장돼요.</p>
      <p>구글로 로그인하면 다음을 저장해요.</p>
      <ul>
        <li>구글 계정의 이메일 주소와 이름 (계정 확인용)</li>
        <li>앱 데이터: 냉장고 재료, 장바구니, 나만의 레시피, 해먹은 요리 기록, 해볼 요리, 식단 조건</li>
      </ul>

      <h2>2. 쓰는 곳</h2>
      <p>여러 기기에서 같은 데이터를 쓰고, 기기를 바꾸거나 브라우저 기록을 지워도 데이터를 되살리는 데만 써요. 광고나 판매에 쓰지 않아요.</p>

      <h2>3. 보관과 위탁</h2>
      <p>
        데이터는 Supabase(Supabase Inc.)의 데이터베이스에 저장돼요. 본인 계정으로만 읽고 쓸 수 있도록 접근이 제한돼 있어요. 사용 통계는
        PostHog로 익명 사용 기록(어떤 화면을 열었는지 등)만 모으고, 식단·알러지 내용은 보내지 않아요.
      </p>

      <h2>4. 삭제</h2>
      <p>
        계정과 저장된 데이터를 지우고 싶으면 아래 메일로 알려 주세요. 7일 안에 지워 드려요. 로그아웃해도 이 기기의 데이터는 남고, 설정의
        "냉장고 비우고 처음부터"로 지울 수 있어요.
      </p>

      <h2>5. 문의</h2>
      <p>
        <a href="mailto:hello@abracadelulu.com">hello@abracadelulu.com</a> · Abracadelulu
      </p>
    </main>
  )
}
