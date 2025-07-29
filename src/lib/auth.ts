
export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const setToken = (token: string) => {
  localStorage.setItem("token", token)
}

export const clearToken = () => {
  localStorage.removeItem("token")
}

export const isAuthenticated = () => {
  return !!getToken()
}


export const logout = () => {
  localStorage.removeItem("token")
  window.location.href = "/" // redirect to homepage
}