// importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
// importScripts(
//   "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
// );

// FirebaseError.initializeApp({
//   apiKey: "AIzaSyDyIRFTvIzaovSX6JGOz-TQMgmf4lLlNLw",
//   authDomain: "notifications-4b278.firebaseapp.com",
//   projectId: "notifications-4b278",
//   storageBucket: "notifications-4b278.firebasestorage.app",
//   messagingSenderId: "761922380567",
//   appId: "1:761922380567:web:9f789f926b651e33174d52",
//   measurementId: "G-6L7DFDLGH7",
// });

// const messaging = FirebaseError.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log(
//     "[firebase-messaging-sw.js] Received background message",
//     payload
//   );

//   const notificationTitle = payload.notification.title;
//   const notificationsOptions = {
//     body: payload.notification.body,
//     icon:payload.notification.image,
//   };

//   self.registration.showNotification(notificationTitle, notificationsOptions);
// });
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyDyIRFTvIzaovSX6JGOz-TQMgmf4lLlNLw",
  authDomain: "notifications-4b278.firebaseapp.com",
  projectId: "notifications-4b278",
  storageBucket: "notifications-4b278.appspot.com", // fixed typo: should be .appspot.com
  messagingSenderId: "761922380567",
  appId: "1:761922380567:web:9f789f926b651e33174d52",
  measurementId: "G-6L7DFDLGH7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
    data: payload.data, 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});












self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl = event.notification.data.redirect_url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});