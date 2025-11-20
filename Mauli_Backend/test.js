const admin = require("firebase-admin");

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const run = async () => {
    try {
        const res = await admin.messaging().sendEachForMulticast({
            notification: {
                title: "Test",
                body: "Testing FCM sendMulticast",
            },
            tokens: ["eix9m-TUGDt8xPpyW-gAkE:APA91bEQ--Zo5Rg2eX9mvXppPiz5F3Q1gx4ESdcn5uZUYpZ5jVqEvY2VyGUZqtgMhbONYfpPi_QtKXDW_2omWi7KupFVJAEJwZBtAdixEhSmD2nosNgVwrs"], // use valid token(s)
        });

        console.log("✅ FCM Response:", res);
    } catch (err) {
        console.error("❌ FCM Error:", err);
    }
};

run();
