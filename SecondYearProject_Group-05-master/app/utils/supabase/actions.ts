// utils/supabase/actions.ts
'use server'

import { createClient } from './server'

export async function registerStudent(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Sign up the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // We store the custom student name right inside the auth metadata
      data: {
        full_name: name,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}

// utils/supabase/actions.ts

// ... keep your existing imports and registerStudent function above ...

export async function loginStudent(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Authenticate credentials against Supabase Auth records
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // If the user isn't registered or entered the wrong password, catch it cleanly here
  if (authError) {
    return { error: 'Invalid email or password!' }
  }

  // 2. TEMPORARY BYPASS: We are skipped the custom "students" table lookup.
  // We assume true for diagnosticCompleted for now so the app routes forward.
  return {
    success: true,
    diagnosticCompleted: true, 
  }
}
