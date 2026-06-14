# SMLD Discipleship Learning Platform

## Overview

The SMLD Discipleship Learning Platform is a web-based application designed to support church discipleship programs by providing structured learning content, assignments, grading, attendance tracking, and learner progress monitoring.

## Features

### Learner Features

* User registration and login
* Cohort enrollment
* Watch educational videos
* Listen to audio lessons
* Read and download notes
* Submit assignments
* Track learning progress
* View grades and feedback
* View submission history

### Lecturer Features

* Upload notes
* Upload videos and audio lessons
* Create assignments
* Grade submissions
* Record attendance
* Publish grades

### Administrator Features

* Manage users
* Manage contributors
* Manage cohorts
* Generate reports
* Monitor platform activity

## Technology Stack

### Frontend

* React
* TypeScript

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL
* Prisma ORM

### Authentication

* JWT
* bcrypt

## Installation

### Clone Repository

git clone <repository-url>

### Backend Setup

cd backend

npm install

### Configure Environment Variables

Create a .env file:

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secret_key

### Run Prisma Migrations

npx prisma migrate dev

### Start Backend

npm run dev

## Git Workflow

Main Branch:

* main

Feature Branches:

* feature/login-page
* feature-dashboard
* feature-assignment-module
* feature-attendance
* feature-grading

Each feature must be developed in its own branch and merged through Pull Requests.

## Authors

SMLD Development Team- Robert, Steve, Brian, and Kahiga.
