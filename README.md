# After School Classes - Backend API

Node.js/Express.js REST API backend with MongoDB Atlas integration for managing after-school classes, orders, and availability.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB Atlas** cloud database
- **Comprehensive validation** and error handling
- **Full-text search** functionality
- **Static file serving** for lesson images
- **Request logging** middleware

## 📋 Assignment Requirements Met

### Back-End Requirements
- ✅ Node.js/Express.js server
- ✅ MongoDB Atlas with native driver
- ✅ REST API endpoints (GET, POST, PUT)
- ✅ Logger middleware
- ✅ Static file middleware with error handling
- ✅ Search functionality (Approach 2 - Back-end implementation)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lessons` | Get all lessons |
| POST | `/orders` | Create a new order |
| PUT | `/lessons/:id` | Update lesson attributes |
| GET | `/search?q=:query` | Search lessons |
| GET | `/images/:filename` | Serve lesson images |

## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/ha1291/after-school-classes-backend.git
   