# Confluence 연동 설정 가이드

## 🔧 설정 단계

### 1. Confluence API 토큰 생성

1. **Atlassian 계정 설정 페이지** 접속

   - https://id.atlassian.com/manage-profile/security/api-tokens

2. **API 토큰 생성**
   - "Create API token" 클릭
   - 토큰 이름 입력 (예: "Meeting Transcription App")
   - 생성된 토큰 복사 (한 번만 표시됨)

### 2. 환경변수 설정

백엔드 `.env` 파일에 다음 정보 추가:

```env
# Confluence API Configuration
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-generated-api-token
CONFLUENCE_SPACE_KEY=YOUR_SPACE_KEY
```

### 3. 설정 값 확인 방법

#### CONFLUENCE_BASE_URL

- Confluence 사이트 URL (예: https://mycompany.atlassian.net)

#### CONFLUENCE_EMAIL

- Atlassian 계정 이메일 주소

#### CONFLUENCE_API_TOKEN

- 위에서 생성한 API 토큰

#### CONFLUENCE_SPACE_KEY

- 회의록을 업로드할 스페이스의 키
- Confluence 스페이스 설정에서 확인 가능
- 예: "TEAM", "PROJ", "MEET" 등

## 🧪 연동 테스트

### 1. 백엔드 헬스체크

```bash
curl http://localhost:3001/api/confluence/health
```

### 2. 프론트엔드에서 테스트

1. 회의록 생성
2. "Confluence" 버튼 클릭
3. 성공 시 새 탭에서 Confluence 페이지 열림

## 🔍 문제 해결

### 401 Unauthorized

- API 토큰이 잘못되었거나 만료됨
- 이메일 주소가 틀림

### 403 Forbidden

- 스페이스에 대한 쓰기 권한이 없음
- 스페이스 키가 잘못됨

### 404 Not Found

- 스페이스가 존재하지 않음
- BASE_URL이 잘못됨

## 📋 생성되는 페이지 형식

```html
<h1>회의록 제목</h1>

<h2>📋 회의 요약</h2>
<p>회의 요약 내용...</p>

<h2>👥 참석자</h2>
<ul>
  <li>참석자1</li>
  <li>참석자2</li>
</ul>

<h2>🔑 핵심 포인트</h2>
<ul>
  <li>핵심 포인트1</li>
  <li>핵심 포인트2</li>
</ul>

<h2>✅ 액션 아이템</h2>
<ul>
  <li>액션 아이템1</li>
  <li>액션 아이템2</li>
</ul>

<h2>📝 상세 내용</h2>
<div>회의 상세 내용...</div>
```

## 🚀 사용법

1. **회의 녹음 및 전사**: 기존과 동일
2. **회의록 생성**: AI가 자동 생성
3. **Confluence 업로드**: "Confluence" 버튼 클릭
4. **페이지 확인**: 새 탭에서 자동으로 열림

## ⚙️ 고급 설정 (향후 개발 예정)

- [ ] 스페이스 선택 UI
- [ ] 부모 페이지 지정
- [ ] 템플릿 커스터마이징
- [ ] 자동 태그/라벨 추가
- [ ] 팀원 자동 멘션

