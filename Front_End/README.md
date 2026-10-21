# React + Vite

## Geoapify interactive map

Create `Front_End/.env.local` with the Geoapify key for browser map tiles:

```env
VITE_GEOAPIFY_API_KEY=your_geoapify_key
```

Restart the Vite development server after changing the file. Vite embeds this
key in frontend assets, so restrict it in Geoapify to the application's
domains and the required Maps API. Keep the server-side `GEOAPIFY_API_KEY`
configuration separate.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
