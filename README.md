# Ecommerce Workspace

## Final Architecture
- `ecommerce-user-app/`: stable customer React Native app using package `com.ecommerce`.
- `ecommerce-admin-app/`: standalone admin React Native app using package `com.ecommerce.admin`.
- `backend/`: single Express, MongoDB, JWT, OTP, and Socket.IO backend for user and admin APIs.
- `shared/`: API and realtime contracts only. No shared `AppRegistry`, `MainActivity`, Metro entry point, or native boot code.

## Deleted Legacy Targets
- Remove `Ecommerce/` after final backup verification. It contains the old flavor-based experiment.
- Remove the old admin backend clone after confirming the unified `backend/` is deployed.
- Remove `backend_repo_export/` when no longer needed as an export snapshot.
- Remove generated Android build folders with `npm run clean:android` or `.\android\gradlew.bat clean` inside each app.

## Migration Strategy
1. Keep `ecommerce-user-app/` as the protected production user app.
2. Keep user auth, OTP, products, orders, and navigation untouched.
3. Run admin only from `ecommerce-admin-app/`, never from user app flavors.
4. Deploy only `backend/` on Render and retire the separate admin backend service.
5. Seed a real admin user with `npm run seed:admin`.
6. Point both mobile apps at the unified backend base URL.

## Local Commands
```powershell
cd C:\RN\backend
copy .env.example .env
npm install
npm run seed:admin
npm run dev
```

```powershell
cd C:\RN\ecommerce-user-app
npm install
npx react-native start --reset-cache
npx react-native run-android
```

```powershell
cd C:\RN\ecommerce-admin-app
npm install
npm run start
npm run android
```

## Backend API
- User auth: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/verify-otp`, `/api/v1/auth/logout`.
- User catalog: `/api/v1/products`, `/api/v1/orders`, `/api/v1/users`.
- Admin auth: `/api/v1/admin/auth/login`.
- Admin operations: `/api/v1/admin/dashboard/metrics`, `/api/v1/admin/activities`, `/api/v1/admin/users`, `/api/v1/admin/products`, `/api/v1/admin/orders`.

## Realtime Flow
```text
User app action -> backend service -> database write/activity log -> Socket.IO event -> admin-room -> admin dashboard refresh
Admin action -> backend service -> database write/activity log -> Socket.IO event -> admin-room/user:{id} -> admin and user updates
```

## Render Deployment
- `render.yaml` deploys only `backend/`.
- Production URL: `https://ecommerce-app-backend-1kn0.onrender.com`.
- Required secrets: `MONGO_URI`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, email provider secrets, media provider secrets, and payment secrets.
- Retire the old separate admin Render service after the admin app is verified against the unified backend.

## Production Notes
- Keep `JWT_SECRET` and `ADMIN_JWT_SECRET` different.
- Restrict `CLIENT_URL` instead of using `*` for production web clients.
- Use Render environment groups for shared secrets.
- Add rate limiting to auth and OTP routes before public launch.
- Add indexes for `Product.slug`, `Order.user`, `Order.createdAt`, `User.email`, and `Activity.createdAt`.
