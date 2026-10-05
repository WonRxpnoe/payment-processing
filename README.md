# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Brand assets

The favicon, installed-app icons, web manifest, and the share card for each page
in `public/` are rendered from `public/brand/kithpay-logo.svg`,
`public/brand/kithpay-mark.svg`, and the card copy in `src/lib/social-cards.ts`.
After editing any of those, regenerate and commit the output:

```sh
npm run brand:assets
```

The generator records the digest of its inputs in `scripts/brand-assets.lock.json`,
so `npm test` fails if the committed images are older than the sources.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
