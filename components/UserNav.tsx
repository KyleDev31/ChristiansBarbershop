import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Cookies from "js-cookie"

async function handleLogout() {
  try {
    await signOut(auth)
  } finally {
    Cookies.remove("firebase-token")
    window.location.href = "/login"
  }
}

export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={handleLogout}>Sign out</button>
    </div>
  )
}