import * as SecureStore from 'expo-secure-store';
const BASE=(process.env.EXPO_PUBLIC_API_URL||'http://10.0.2.2:3000').replace(/\/$/,'');
const ACCESS='headsup_access', REFRESH='headsup_refresh';
export async function saveSession(s:{accessToken:string;refreshToken:string}){await SecureStore.setItemAsync(ACCESS,s.accessToken);await SecureStore.setItemAsync(REFRESH,s.refreshToken);}
export async function clearSession(){await SecureStore.deleteItemAsync(ACCESS);await SecureStore.deleteItemAsync(REFRESH);}
export async function hasSession(){return Boolean(await SecureStore.getItemAsync(REFRESH));}
async function refresh(){const refreshToken=await SecureStore.getItemAsync(REFRESH);if(!refreshToken)return false;const r=await fetch(`${BASE}/auth/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken})});if(!r.ok){await clearSession();return false;}const s=await r.json();await saveSession(s);return true;}
export async function api<T=any>(path:string,init:RequestInit={},retry=true):Promise<T>{const token=await SecureStore.getItemAsync(ACCESS);const headers:any={...(init.headers||{}),'Content-Type':'application/json'};if(token)headers.Authorization=`Bearer ${token}`;const r=await fetch(`${BASE}${path}`,{...init,headers});if(r.status===401&&retry&&await refresh())return api<T>(path,init,false);if(!r.ok){let msg=`HTTP ${r.status}`;try{const j=await r.json();msg=j.message||msg}catch{}throw new Error(Array.isArray(msg)?msg.join('\n'):String(msg));}return r.status===204?undefined as T:r.json();}
export async function login(email:string,password:string){const s=await api<any>('/auth/login',{method:'POST',body:JSON.stringify({email,password})},false);await saveSession(s);return s;}
export async function register(email:string,password:string){const s=await api<any>('/auth/register',{method:'POST',body:JSON.stringify({email,password})},false);await saveSession(s);return s;}

export async function logoutSession(){
  const refreshToken=await SecureStore.getItemAsync(REFRESH);
  if(refreshToken){
    try{await fetch(`${BASE}/auth/logout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken})});}catch{}
  }
  await clearSession();
}
