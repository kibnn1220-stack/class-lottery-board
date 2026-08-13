# 우리 반 행운 복권판

중학교 사회·역사 수업과 학급 운영에서 보상으로 사용할 수 있는 복권판 웹앱입니다.

## 기술 스택
- Vite + React
- Supabase: 학생/복권/당첨 기록 영구 저장용
- Vercel: 배포
- GitHub: 소스코드 및 기본 보상 데이터 버전 관리

## 로컬 실행
```bash
npm install
npm run dev
```

## Supabase 연결
`.env.example`을 `.env.local`로 복사하고 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 입력합니다.

다음 단계에서 `classes`, `students`, `rewards`, `draw_history` 테이블을 추가해 여러 학급을 분리해 운영할 수 있습니다.

## Vercel 배포
GitHub 저장소를 Vercel에서 Import한 뒤 환경변수 2개를 등록하면 됩니다.
