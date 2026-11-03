
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from './firebase'

export async function registerUser({ fullName, email, password }) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )

  await updateProfile(userCredential.user, {
    displayName: fullName,
  })

  return userCredential.user
}
