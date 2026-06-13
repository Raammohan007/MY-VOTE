# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 🗳️ Class Election Voting System

A comprehensive, modern voting application designed for tuition centers to conduct fair and transparent elections for class positions.

### Features

**Multi-Grade Voting Structure**
- Grades 6-10: Vote for Boy & Girl Class Representatives
- Grade 11: Vote for Assistant Tuition Leader & Coordinators (Science & Commerce groups)
- Grade 12: Vote for Overall Incharge & 4 Coordinators

**Role-Based Access**
- Students: Vote only for their own grade/group
- Teachers: Vote for all grades and roles
- Admin: Manage candidates and view results (PIN: 1234)

**Admin Features**
- Manage candidate names, symbols, photos
- Real-time dashboard with pie charts
- Vote rankings and analytics

### Quick Start

```bash
cd voting-system
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### How to Use

**Students**: Click Student → Enter name/grade → Select grade candidates → Submit

**Teachers**: Click Teacher → Can vote for all grades → Select positions → Submit

**Admin**: Click Admin → Enter PIN (1234) → Manage candidates or view results

### Data Persistence
- Saves data to localStorage automatically
- Teachers can vote for all grades
- Students restricted to their own grade

For more details, see the application's built in documentation.

