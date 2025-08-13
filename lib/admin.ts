import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function createAdminAccount(
  email: string,
  password: string,
  fullName: string,
  phone: string
) {
  try {
    // Check if user already exists
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create admin user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      fullName,
      phone,
      createdAt: new Date(),
      role: 'admin',
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error creating admin account:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function isUserAdmin(uid: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    const userData = userDoc.data()
    return userData?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
} 