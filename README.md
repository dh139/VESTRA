# VESTRA | Premium Modern Fashion Storefront & CMS

VESTRA is a direct-to-consumer premium apparel storefront and admin content management system built with Node.js, Express, React, Vite, and MongoDB.

---

## Key Features

1. **Modern Responsive Storefront:** Custom-built inset floating pill navigation, scroll padding shifts, and slide-up animations.
2. **Dynamic Product Details Page:** Custom coordinates-based hover zoom, interactive star rating reviews, and size/color swatches with dynamic reactive image matching.
3. **Structured Admin Panel:** Control dashboard featuring analytical SVG Line Charts, order method/pipeline splits, drag-and-drop homepage CMS layout builder, CSV pincode uploader, and side-by-side audit change history logs.
4. **Secure Checkout Summary:** Server-side pricing recalculation, coupon discounts, serviceable pincode autofill lookups, and mock payment simulations.
5. **Secure Authentication:** Integrated local credentials registration and native Google OAuth verification on both client and server.
6. **Automatic Invoicing:** Checkout completion automatically triggers PDF invoice generation, binded statically to customer profiles.

---

## Technical Stack

*   **Frontend:** React (SPA), Vite, Zustand, Tailwind CSS, Lucide Icons
*   **Backend:** Node.js, Express, MongoDB (Mongoose), PDFKit, Cloudinary
*   **Authentication:** JWT, Google OAuth (google-auth-library)

---

## Setup & Local Development

1. **Environment Setup:**
   *   Create `server/.env` matching the template in `server/.env.example`.
   *   Create `client/.env` matching the template in `client/.env.example`.

2. **Seeding the Database:**
   ```bash
   npm run seed --prefix server
   ```

3. **Running the Applications:**
   *   **Backend Server:** `npm run dev --prefix server` (Listens on port 5000)
   *   **Frontend Client:** `npm run dev --prefix client` (Listens on port 5173)
