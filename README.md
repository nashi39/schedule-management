# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## デプロイ

- 本番: https://schedule-management-1prvepmky-nashis-projects-b747561b.vercel.app
- 直近のビルド: https://schedule-management-h62tvpyz6-nashis-projects-b747561b.vercel.app
- 旧ビルド参考: https://schedule-management-nepwzvh29-nashis-projects-b747561b.vercel.app
- 通知許可が必要です。iOS はホーム追加後に許可可能。

## 開発

npm i
npm run dev
npm run build

## 機能

- 予定追加・削除、複数日一括登録
- 予定の 5 分前/開始時に通知
- PWA 対応（インストール可）
