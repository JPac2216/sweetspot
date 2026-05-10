# SweetSpot
SweetSpot is a web application for discovering, planning, and sharing date ideas in New York City. Users can browse restaurant spots pulled from NYC open data, create public or private date itineraries, favorite dates made by others, and manage their profile. An admin dashboard allows moderation of user-submitted appeals.

**Authors:** Matthew Mohamed, Jake Paccione, Sameer Sethuram, Sarah Simbulan

---

## Prerequisites

Before running the project, make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| [Node.js](https://nodejs.org/) | v18 or higher | https://nodejs.org/ |
| [MongoDB Community Server](https://www.mongodb.com/try/download/community) | v6 or higher | https://www.mongodb.com/try/download/community |

To verify your installations, run:

```bash
node -v
mongod --version
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/JPac2216/sweetspot.git
cd sweetspot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

MongoDB must be running locally before you start the app. In a separate terminal window, run:

```bash
mongod
```

> By default the app connects to `mongodb://localhost:27017/` and uses a database named `sweetspot`. No extra configuration is needed.

### 4. Seed the database

This step populates the database with sample users, real NYC restaurant spots (fetched from the NYC open data API), date itineraries, and appeals.

```bash
npm run seed
```

> The seed script fetches live restaurant data from the NYC DOHMH Restaurant Inspection dataset, so an internet connection is required. It targets 50 spots across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island.

> Sample logins:
  Admin:   admin@sweetspot.com / Admin123!
  Member:  alice@example.com   / Password1!
  Member:  bob@example.com     / Password1!
  Member:  carlos@example.com  / Password1!

### 5. Start the server

```bash
npm start
```

The app will be running at **http://localhost:3000**.

---

## Using the Application

### Registering and Signing In

1. Navigate to **http://localhost:3000**. You will be redirected to the sign-in page.
2. Click **Register** to create a new account. You will need to provide:
   - First and last name
   - Email address (must be unique)
   - Username (must be unique)
   - Password (minimum 8 characters, must include at least one uppercase letter, one number, and one special character)
   - Gender
   - Primary location (NYC borough: Manhattan, Brooklyn, Queens, the Bronx, or Staten Island)
   - Secondary location (optional)
3. After registering, sign in with your email and password.

### Navigating the App

Once signed in, you have access to the following pages:

| Page | URL | Description |
|------|-----|-------------|
| Home | `/home` | Browse restaurant spots filtered by your primary borough |
| Explore | `/explore` | Browse all public date itineraries |
| Profile | `/profile` | View your created dates, favorited dates, and account details |
| Edit Profile | `/profile/edit` | Update your name, email, username, location, or password |
| Create Date | `/date/create` | Build a new date itinerary from available spots |
| Date Detail | `/date/:id` | View a specific date, vote on it, and leave comments |
| Spots | `/spots` | Browse all restaurant spots |

### Creating a Date

1. Go to **Create Date** from the navigation.
2. Give your date a title and description.
3. Add spots from the available list.
4. Choose whether the date is **public** (visible to all users) or **private** (only visible to you).
5. Submit to save your date.

### Favoriting a Date

On any public date's detail page, click the favorite button to save it to your profile.

### Editing Your Profile

1. Go to **Profile → Edit Profile**.
2. Fill in only the fields you want to change.
3. To change your password, enter your new password in the **New Password** field.
4. Your **current password is always required** to save any changes.

### Admin Account

The seed script creates an admin user you can use to access the admin dashboard at `/admin`.
Sample logins:
  Admin:   admin@sweetspot.com / Admin123!

---


## Technologies Used

- **[Express](https://expressjs.com/)** — Web framework
- **[MongoDB](https://www.mongodb.com/)** — Database
- **[Express Handlebars](https://github.com/express-handlebars/express-handlebars)** — Templating engine
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — Password hashing
- **[express-session](https://github.com/expressjs/session)** — Session management
- **[xss](https://github.com/leizongmin/js-xss)** — XSS sanitization

---
