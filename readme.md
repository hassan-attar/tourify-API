# Natours API

<img src="./public/img/natours-api-transparent.png" width="200" />

Welcome to the Natours API! This API allows you to manage tours, user authentication, bookings, reviews, and more. It's built using Node.js with the Express framework and MongoDB for the database.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Technologies Used](#technologies-used)
- [License](#license)

## Introduction

The Natours API provides a comprehensive backend solution for managing tours and related activities. Whether you're an administrator creating tours, users booking experiences, or reviewers leaving feedback, this API handles it all.

## Features

- User authentication and authorization
- Tour creation, modification, and deletion
- Tour reviews and ratings
- Booking management and checkout
- Advanced search and filtering for tours
- User profile management
- Tour statistics and analytics

## Getting Started

To set up the Natours API locally, follow these steps:

1. Clone this repository.
2. Install Node.js and MongoDB if not already installed.
3. Install the required dependencies by running: `npm install`
4. Create a `.env` file in the root directory and set the necessary environment variables. use config.env.example as a template.
5. Start the server with: `npm start`

## API Documentation

The Natours API provides a set of endpoints for various functionalities:

- **Tours**: Endpoints related to managing tours and tour information.
- **Reviews**: Endpoints for submitting and retrieving tour reviews and ratings.
- **Users**: Endpoints for user authentication, registration, and profile management.
- **Bookings**: Endpoints for booking tours and managing bookings.

For detailed information on each endpoint and how to use them, please refer to the [API Documentation](#https://documenter.getpostman.com/view/26563178/2s9Y5csKeB).

## Technologies Used

The Natours API is built using the following technologies:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT (JSON Web Tokens) for authentication
- Stripe for payment processing
- Nodemailer for sending emails
- And more...

## License

This project is licensed under the [MIT License](LICENSE).
