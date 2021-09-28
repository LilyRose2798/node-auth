import { Schema, Model, Document, SchemaDefinition, DocumentDefinition } from "mongoose"
import { HashPreferences, DigestAlgorithmPreferences, SaltPreferences, PlainHashPreferences, PlainHashSaltPreferences, HMACPreferences, PBKDF2Preferences, BCryptPreferences, SCryptPreferences, Argon2Preferences } from "../../common/build/HashPreferences"

type SchemaType<T, U = any> = Schema<T & Document<U, any, T>, Model<T & Document<U, any, T>, any, any>, T>

const DigestAlgorithmPreferencesSchemaDefinition: SchemaDefinition<DigestAlgorithmPreferences> = {
    digestAlgorithm: { type: String, required: false }
}

const SaltPreferencesSchemaDefinition: SchemaDefinition<SaltPreferences> = {
    saltLength: { type: Number, required: false }
}

export const PlainHashPreferencesSchema: SchemaType<PlainHashPreferences> = new Schema(DigestAlgorithmPreferencesSchemaDefinition, { _id: false })

export const PlainHashSaltPreferencesSchema: SchemaType<PlainHashSaltPreferences> = new Schema({
    ...DigestAlgorithmPreferencesSchemaDefinition,
    ...SaltPreferencesSchemaDefinition
}, { _id: false })

export const HMACPreferencesSchema: SchemaType<HMACPreferences> = new Schema({
    ...DigestAlgorithmPreferencesSchemaDefinition,
    ...SaltPreferencesSchemaDefinition
}, { _id: false })

export const PBKDF2PreferencesSchema: SchemaType<PBKDF2Preferences> = new Schema({
    ...DigestAlgorithmPreferencesSchemaDefinition,
    ...SaltPreferencesSchemaDefinition,
    iterations: { type: Number, required: false },
    hashLength: { type: Number, required: false }
}, { _id: false })

export const BCryptPreferencesSchema: SchemaType<BCryptPreferences> = new Schema({
    minorVersion: { type: String, required: false },
    rounds: { type: Number, required: false }
}, { _id: false })

export const SCryptPreferencesSchema: SchemaType<SCryptPreferences> = new Schema({
    ...SaltPreferencesSchemaDefinition,
    hashLength: { type: Number, required: false },
    cost: { type: Number, required: false },
    blockSize: { type: Number, required: false },
    parallelization: { type: Number, required: false }
}, { _id: false })

export const Argon2PreferencesSchema: SchemaType<Argon2Preferences> = new Schema({
    ...SaltPreferencesSchemaDefinition,
    type: { type: String, required: false },
    version: { type: String, required: false },
    hashLength: { type: Number, required: false },
    memoryCost: { type: Number, required: false },
    timeCost: { type: Number, required: false },
    parallelism: { type: Number, required: false }
}, { _id: false })

export const HashPreferencesSchema: SchemaType<HashPreferences> = new Schema({
    algorithm: { type: String, required: true }
}, { discriminatorKey: "algorithm", _id: false })

export default HashPreferencesSchema
