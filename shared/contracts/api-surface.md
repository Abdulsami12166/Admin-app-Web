# API Surface

Base path: `/api/v1`

## User auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## User account
- `GET /users/profile`
- `PUT /users/profile`
- `POST /users/profile/avatar`
- `PATCH /users/wishlist`

## Catalog
- `GET /products`
- `GET /products/:id`

## Orders
- `GET /orders`
- `GET /orders/:id`
- `POST /orders`

## Admin
- `POST /admin/auth/login`
- `GET /admin/dashboard/metrics`
- `GET /admin/activities`
- `GET /admin/users`
- `GET /admin/users/:id/orders`
- `POST /admin/users/:id/block`
- `POST /admin/users/:id/unblock`
- `POST /admin/users/:id/logout`
- `DELETE /admin/users/:id`
- `GET /admin/products`
- `POST /admin/products`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- `GET /admin/orders`
- `POST /admin/orders`
- `PATCH /admin/orders/:id/status`
- `DELETE /admin/orders/:id`
