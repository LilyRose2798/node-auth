import HashPreferences from "./HashPreferences"

export interface UserInfo {
    username: string
    email: string
    firstName: string
    lastName?: string
    hashPreferences?: HashPreferences
}

export type User = UserInfo & { passwordHash: string }

export default User
