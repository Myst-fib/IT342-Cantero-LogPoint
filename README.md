<div align="center">

# 🪵 LogPoint

**User Registration & Authentication System**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-logpoint--frontend.onrender.com-2B5748?style=for-the-badge&logo=render&logoColor=white)](https://logpoint-frontend.onrender.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-Backend-618764?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-Frontend-9CB080?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-273338?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

*IT342 – System Integration · Lab 1 · Patrick Cantero*

</div>

---

## 📌 Overview

LogPoint is a full-stack **User Registration & Authentication System** built as part of IT342 – System Integration. It features a secure Spring Boot backend with BCrypt password encryption and a ReactJS frontend with protected routes.

---

## 🗂️ Repository Structure

```
IT342-Cantero-LogPoint/
├── /web            # ReactJS frontend
├── /backend        # Spring Boot backend
├── /mobile         # Mobile app (coming soon)
├── /docs           # FRS, ERD, UML diagrams, screenshots
├── README.md
└── TASK_CHECKLIST.md
```

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | ReactJS |
| Backend | Java, Spring Boot, Spring Security |
| Database | MySQL + JPA / Hibernate |
| Auth | BCrypt password encryption |
| Deployment | Render |

---

## ⚙️ Backend – Spring Boot

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login existing user |
| `GET` | `/api/user/me` | Get current user info *(protected)* |

### Setup

1. Install **Java 17+** and **Maven**
2. Configure your database in `/backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/your_db_name
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
spring.jpa.hibernate.ddl-auto=update
```

3. Build and run:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

---

## 🌐 Frontend – ReactJS

### Pages

- 📝 Register
- 🔐 Login
- 🏠 Dashboard / Profile *(protected)*
- 🚪 Logout

### Setup

```bash
cd web
npm install
npm start
```

App runs at → [http://localhost:3000](http://localhost:3000)

---

## 📄 Documentation (`/docs`)

- **ERD** – Database structure diagram
- **UML Diagrams** – Class and sequence diagrams
- **Screenshots** – Register, Login, Dashboard, Logout pages

---

## ✅ Task Checklist

All tasks are marked as **DONE** in [`TASK_CHECKLIST.md`](./TASK_CHECKLIST.md) with their corresponding commit hashes.

---

<div align="center">

**Patrick Cantero** · IT342 – System Integration · Lab 1

</div>
