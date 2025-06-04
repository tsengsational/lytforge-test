# Multi-User Todo List Application

A collaborative todo list application built with AngularJS and Firebase, featuring Google Authentication and real-time updates.

## Features

- Google Authentication for user management
- Create multiple todo lists
- Public and private list options
- Real-time collaboration
- Assign items to specific users
- Mark items as complete/incomplete
- Add/remove items
- Responsive design

## Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication in the Firebase Console
3. Create a Realtime Database in Firebase
4. Replace the Firebase configuration in `app.js` with your own configuration
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start the development server:
   ```bash
   npm start
   ```
7. Open http://localhost:8080 in your browser

## Firebase Configuration

Replace the following configuration in `app.js` with your Firebase project details:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Usage

1. Click "Login with Google" to authenticate
2. Create a new list using the form on the left
3. Add items to your lists
4. Mark items as complete by checking the checkbox
5. Assign items to other users by clicking the "Assign" button
6. Remove items using the "Remove" button
7. Share public lists by sharing the URL

## Security Rules

Set up the following Firebase Realtime Database rules:

```json
{
  "rules": {
    "lists": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$listId": {
        ".read": "data.child('isPublic').val() === true || data.child('owner').val() === auth.uid || data.child('members').child(auth.uid).exists()",
        ".write": "data.child('owner').val() === auth.uid || data.child('members').child(auth.uid).exists()"
      }
    }
  }
}
```

## License

MIT 