// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getMessaging,getToken} from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyDyIRFTvIzaovSX6JGOz-TQMgmf4lLlNLw",
  authDomain: "notifications-4b278.firebaseapp.com",
  projectId: "notifications-4b278",
  storageBucket: "notifications-4b278.firebasestorage.app",
  messagingSenderId: "761922380567",
  appId: "1:761922380567:web:9f789f926b651e33174d52",
  measurementId: "G-6L7DFDLGH7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const generateToken =async()=>{
    const permission=await Notification.requestPermission()

    // console.log(permission);
    if(permission=="granted"){
         const token=await getToken(messaging,{
            vapidKey:"BOjGwwPk4bImaFSEl2gxm5rAjFhKWkIxyYk7vpOQqnmaUzjzNmajbXDleQ9W_FfHsw5I782t-H9HAhw-O2rX3b0"	 
         })
        //  console.log(token);
         return token;
    }
}
