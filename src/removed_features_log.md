# Removed UI Features Log (2026-01-18)

以下の機能・UIコンポーネントを、一時的な封印（再構成待ち）のために `src/layouts/Layout.astro` から削除しました。
復元の際は、このログまたはGit履歴を参照して元の場所に戻してください。

## 1. Top Navigation "About" Link
- **File**: `src/layouts/Layout.astro`
- **Location**: Inside `<div class="nav-main">`
- **Content**: `<a href={`${BASE}about/`}>About</a>`
- **Action**: Commented out (or Removed).

## 2. Top Right "DEEP" Button
- **File**: `src/layouts/Layout.astro`
- **Location**: Inside `<nav>` (after `.nav-main`)
- **Content**:
  ```astro
  <a href={`${BASE}deep-observation/`} class="nav-deep" aria-label="深層観測（DEEP）へアクセスする">
     <svg ...>...</svg>
     DEEP
  </a>
  ```
- **Action**: Removed (DOM element deleted).

## 3. Footer "DEEP OBSERVATION" Link
- **File**: `src/layouts/Layout.astro`
- **Location**: Inside `<footer class="site-footer">` -> `<div class="container footer-inner">`
- **Content**:
  ```astro
  <a href={`${BASE}deep-observation/`} class="footer-deep">
    <svg ...>...</svg>
    DEEP OBSERVATION
  </a>
  ```
- **Action**: Removed (DOM element deleted).

## 4. Bottom Right "OBSERVATION" Toast UI
- **File**: `src/layouts/Layout.astro`
- **Location**: Top-level inside `<body>`, before `</body>`
- **Content**:
  ```astro
  <div id="obs-toast" class="obs-toast" ...>
    ...
  </div>
  ```
- **Action**: Removed (DOM element deleted).
