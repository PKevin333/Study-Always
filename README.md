<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cf04fd2b-889a-44f8-b35b-965ca983e446

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Production

Run `npm run build` followed by `npm start` to serve the app and the mentor API together. The default port is 3000; set `PORT` to override it.

On Vercel, `/api/mentor-advice` is served by the function in `api/mentor-advice.ts`. Configure `GEMINI_API_KEY` and Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_JSON`, or Application Default Credentials) in the server environment. Never expose these secrets through `VITE_` variables.

Firebase Hosting currently publishes only the static frontend. The mentor API requires a separately deployed backend (Cloud Run or Cloud Functions) and a Hosting rewrite to that service. `firebase deploy --only hosting` does not deploy `server.ts`.

## Tests

- `npm test -- --run`: unit tests; Firestore rules tests are skipped when no emulator is running.
- `npm run test:rules`: starts the Firestore emulator and runs the security rules tests. Requires Java 21 or later. Alternatively, with an emulator already running, set `FIRESTORE_EMULATOR_HOST` and run `npm test -- --run`.
