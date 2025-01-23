const API_BASE = process.env.NEXT_PUBLIC_API_URL

interface LoginResponse {
  access: string
  refresh: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export async function loginApiCall(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/accounts/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { data: null, error: errorData.message || "Login failed" }
    }

    const data: LoginResponse = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error("Login error:", error)
    return { data: null, error: "An unexpected error occurred" }
  }
}
