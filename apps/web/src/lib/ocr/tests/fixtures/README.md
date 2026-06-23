# OCR Parser Regression Fixtures

이 디렉터리에 fixture 페어를 두면 `parser-regression.test.ts`가 자동으로 회귀 테스트를 돌린다.
fixture가 없으면 회귀 테스트는 자동 skip.

## 파일 명명 규칙

```
<case-name>.tokens.json       — ⑤ 래퍼 정규화 결과 (OcrToken[])
<case-name>.expected.json     — ④ parser 기대 출력
```

예시:

```
franchise-pos-1.tokens.json
franchise-pos-1.expected.json
small-restaurant-1.tokens.json
small-restaurant-1.expected.json
```

## 작성 방법 (④)

1. 실제 영수증 이미지를 CLOVA General OCR V2로 호출 (개발 환경 키 사용).
2. ⑤ 래퍼 `normalizeFields()` 결과를 `.tokens.json`에 저장 (`OcrToken[]` 형태).
3. parser를 돌려 사람이 검수한 출력을 `.expected.json`에 저장.
4. PR로 추가. CI에서 OCR 키 없이 회귀 테스트 자동 실행.

## expected 갱신

자동 update 금지. 사람 검수 후 명시 갱신만 허용:

```bash
pnpm --filter @yummpi/web test:ocr -- -u
```

`-u` 없이 실행하면 expected와 다를 경우 실패한다.

## 보안

`*.tokens.json` / `*.expected.json`은 실제 영수증 원본 이미지를 포함하지 않는다.
카드번호 패턴이 토큰에 섞여 있을 수 있으므로 fixture 추가 전 마스킹 확인.
