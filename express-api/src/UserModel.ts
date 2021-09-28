import { Schema, Model, Document, model } from "mongoose"
import { getHashPreferences, hashPassword, verifyPassword, needsRehash } from "./HashAlgorithm"
import { HashPreferencesSchema, PlainHashPreferencesSchema, PlainHashSaltPreferencesSchema, HMACPreferencesSchema, PBKDF2PreferencesSchema, BCryptPreferencesSchema, SCryptPreferencesSchema, Argon2PreferencesSchema } from "./HashPreferencesSchema"
import { pick } from "./util"
import { User } from "../../common/build/User"
import { UserPublic, UserPrivate } from "../../common/build/API"
import HashPreferences from "../../common/src/HashPreferences"

export interface UserDocument extends User, Document<string> {
    verifyPassword(password: string): Promise<boolean>
    toPublic(): UserPublic
    toPrivate(): UserPrivate
}

export interface UserModel extends Model<UserDocument> {
    hashPassword(password: string, hashPreferences?: HashPreferences): Promise<string>
}

const UserSchema = new Schema<UserDocument, UserModel, User>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    passwordHash: { type: String, required: true },
    hashPreferences: { type: HashPreferencesSchema, required: false }
}, { versionKey: false })

const hashPreferencesPath = UserSchema.path<Schema.Types.Embedded>("hashPreferences")
hashPreferencesPath.discriminator("Plain Hash", PlainHashPreferencesSchema)
hashPreferencesPath.discriminator("Plain Hash+Salt", PlainHashSaltPreferencesSchema)
hashPreferencesPath.discriminator("HMAC", HMACPreferencesSchema)
hashPreferencesPath.discriminator("PBKDF2", PBKDF2PreferencesSchema)
hashPreferencesPath.discriminator("BCrypt", BCryptPreferencesSchema)
hashPreferencesPath.discriminator("SCrypt", SCryptPreferencesSchema)
hashPreferencesPath.discriminator("Argon2", Argon2PreferencesSchema)

UserSchema.virtual("fullName").get(function(this: UserDocument) {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName
})

UserSchema.methods.verifyPassword = async function(this: UserDocument, password: string): Promise<boolean> {
    const userObj = this.toObject()
    try {
        const passwordHashPrefs = getHashPreferences(userObj.passwordHash)
        const verified = await verifyPassword(password, userObj.passwordHash, passwordHashPrefs)
        if (verified && needsRehash(userObj.passwordHash, userObj.hashPreferences, passwordHashPrefs)) {
            try {
                this.passwordHash = await hashPassword(password, userObj.hashPreferences)
                this.save()
            } catch (e) {
                console.error(e)
            }
        }
        return verified
    } catch (e) {
        console.error(e)
        return false
    }
}

UserSchema.methods.toPublic = function(this: UserDocument): UserPublic {
    return { id: this._id, ...pick(this, "username", "email", "firstName", "lastName")}
}

UserSchema.methods.toPrivate = function(this: UserDocument): UserPrivate {
    return { id: this._id, ...pick(this, "username", "email", "firstName", "lastName", "passwordHash", "hashPreferences")}
}

UserSchema.statics.hashPassword = function(password: string, hashPreferences?: HashPreferences) {
    return hashPassword(password, hashPreferences)
}

export const UserModel = model<UserDocument, UserModel>("User", UserSchema)

export default UserModel
