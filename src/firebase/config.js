// Lazy Firebase - SDK hanya di-load pas dibutuhkan (login/auth check)
// Bukan di critical rendering path - FCP lebih cepat

let _app=null,_auth=null,_googleProvider=null,_githubProvider=null,_initPromise=null;

async function _init(){const[{initializeApp},m]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
_app=initializeApp({apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID,measurementId:import.meta.env.VITE_FIREBASE_MEASUREMENT_ID});
_auth=m.getAuth(_app);_googleProvider=new m.GoogleAuthProvider();_githubProvider=new m.GithubAuthProvider();
return{auth:_auth,googleProvider:_googleProvider,githubProvider:_githubProvider,signInWithPopup:m.signInWithPopup,signInWithEmailAndPassword:m.signInWithEmailAndPassword,createUserWithEmailAndPassword:m.createUserWithEmailAndPassword,signOut:m.signOut,onAuthStateChanged:m.onAuthStateChanged}}

export function getFirebase(){if(!_initPromise)_initPromise=_init();return _initPromise}
export async function getAuth(){const fb=await getFirebase();return fb.auth}