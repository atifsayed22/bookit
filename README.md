# BookVerse MERN

BookVerse is a full-stack travel booking platform built with the MERN stack (MongoDB, Express, React, Node.js). It allows two types of users: customers (travelers) and business owners (travel agencies) to interact on a single platform.

## What is BookVerse?
BookVerse is a travel marketplace where:
- **Customers** can browse, view, and book travel packages from various agencies.
- **Business Owners** (agencies) can create, manage, and sell their travel packages to customers.

## How does it work?

### For Customers
- Sign up and log in as a customer.
- Browse travel agencies and their packages.
- View package details, images, and inclusions.
- Book packages, view your bookings, and cancel if needed.

### For Business Owners
- Sign up and log in as a business/agency.
- Create and manage travel packages (add, edit, delete).
- View bookings made by customers for your packages.

## Project Structure
- `frontend/` - React app for both customer and business dashboards.
- `server/` - Node.js/Express backend with MongoDB for data storage.

## Main Endpoints

### Customer Endpoints
- `POST /customers/register` - Register as a customer
- `POST /customers/login` - Customer login
- `GET /customers/bookings` - View your bookings
- `POST /customers/bookings` - Book a package
- `PATCH /customers/appointments/:id/cancel` - Cancel a booking
- `GET /customers/agencies/:agencyId` - View agency and its packages
- `GET /customers/services/:serviceId` - View package details

### Business/Agency Endpoints
- `POST /business/register` - Register as a business
- `POST /business/login` - Business login
- `GET /business/services` - List your packages
- `POST /business/services` - Create a new package
- `PATCH /business/services/:id` - Edit a package
- `DELETE /business/services/:id` - Delete a package
- `GET /business/bookings` - View bookings for your packages

## How to Run
1. Clone the repo and install dependencies in both `frontend/ui` and `server`.
2. Set up your environment variables (see `.env.example`).
3. Start the backend (`npm start` in `server/`).
4. Start the frontend (`npm run dev` in `frontend/ui/`).

---


## Authentication with Clerk
BookVerse uses [Clerk](https://clerk.com/) for secure authentication and user management. Both customers and business owners sign up and log in using Clerk, which provides a seamless and secure experience.

## Business Owner Features

### Listing and Managing Packages
- After logging in as a business owner, go to the "Travel Packages" section.
- Click "Add New Package" to create a new travel package. Fill in details like name, destination, duration, price, description, images, inclusions, and exclusions.
- Edit or delete any package using the "Edit" and "Delete" buttons on each package card.

### Editing Agency Details
- Business owners can update their agency profile and details (such as name, description, contact info, and images) from the agency dashboard/profile section.

### Managing Bookings
- View all bookings made by customers for your packages in the "Bookings" section.
- For each booking, you can:
	- **Accept** the booking (confirm the reservation for the customer)
	- **Cancel** the booking (if needed, with a reason)

All actions are available from the business dashboard after logging in with Clerk.

---
This project is designed to be simple, user-friendly, and easy to extend for more features.
