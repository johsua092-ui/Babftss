import{createContext,useContext,useEffect,useState,useCallback}from'react';import{getFirebase}from'../firebase/config';const AuthContext=createContext(null);
export function AuthProvider({children}){const[user,setUser]=useState(null);const[loading,setLoading]=useState(true);
useEffect(()=>{let unsub=null,cancelled=false;getFirebase().then(({auth,onAuthStateChanged})=>{if(cancelled)return;unsub=onAuthStateChanged(auth,(u)=>{setUser(u);setLoading(false)})});return()=>{cancelled=true;if(unsub)unsub()}},[]);
const loginWithGoogle=useCallback(async()=>{const{auth:a,gp,si}=await getFirebase();return(await si(a,gp)).user},[]);
const loginWithGitHub=useCallback(async()=>{const{auth:a,githubProvider:g,si}=await getFirebase();return(await si(a,g)).user},[]);
const loginWithEmail=useCallback(async(e,p)=>{const{auth:a,si}=await getFirebase();return(await si(a,e,p)).user},[]);
const registerWithEmail=useCallback(async(e,p)=>{const{auth:a,cu}=await getFirebase();return(await cu(a,e,p)).user},[]);
const logout=useCallback(async()=>{const{auth:a,so}=await getFirebase();await so(a)},[]);
const getIdToken=useCallback(async()=>user?user.getIdToken():null,[user]);
return <AuthContext.Provider value={{user,loading,loginWithGoogle,loginWithGitHub,loginWithEmail,registerWithEmail,logout,getIdToken}}>{children}</AuthContext.Provider>}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be used within AuthProvider');return ctx}