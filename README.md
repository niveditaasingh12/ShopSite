# 🛒 E-Commerce Website

A fully functional e-commerce website built from scratch using **Node.js**, **Express**, **MongoDB**, and **EJS**. It includes features like user authentication, product filtering, cart management, multiple addresses, order tracking, and more.

---

##  Features

###  Authentication
- User Sign Up and Login
- Secure Password Handling (bcrypt)
- Logout functionality

###  Shopping
- Browse products
- Product Filtering:
  - Price: Low to High
  - Price: High to Low
  - Discounted Products
- Add to Cart
- Buy Now

###  Orders
- Place Orders from Cart or via Buy Now
- View All Past Orders
- Cancel Any Pending Order

###  User Profile
- Edit Profile Information
- Change Password

###  Address Management
- Add Multiple Addresses
- Edit Existing Addresses
- Set Default Shipping Address

---

##  Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: Cookies + Session

---

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Vanshika-v13/Scatch-Ecommerce.git
cd Scatch-Ecommerce
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory with the following content:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=your_session_secret
```

> Make sure `.env` is added to your `.gitignore`.

### 4. Start the Server

```bash
npm start
```

Then go to: [http://localhost:3000](http://localhost:3000)

---

##  Folder Structure

```
scratch-ecommerce/
├── models/
├── routes/
├── views/
├── public/
├── middlewares/
├── controllers/
├── config/
├── app.js
├── .env
└── README.md
```

---

##  License

This project is licensed under the MIT License.

---

##  Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

