import dotenv from "dotenv"
import Ajv, { ErrorObject, JSONSchemaType } from "ajv"
import AjvJTD, { JTDSchemaType } from "ajv/dist/jtd"
import { PropertiesSchema } from "ajv/dist/types/json-schema"
import ajvErrors from "ajv-errors"
import { SearchQuery, UsersQuery, UserCreateRequest, UserReplaceRequest, UserUpdateRequest, UserAuthenticateRequest } from "../../common/build/API"
import { HashPreferences, DigestAlgorithmPreferences, SaltPreferences, DIGEST_ALGORITHMS, PBKDF2_PREFERENCES_BOUNDS, BCRYPT_PREFERENCES_BOUNDS, SCRYPT_PREFERENCES_BOUNDS, ARGON2_PREFERENCES_BOUNDS, Bound, SALT_PREFERENCES_BOUNDS, BCRYPT_MINOR_VERSIONS, ARGON2_TYPES, ARGON2_VERSIONS } from "../../common/build/HashPreferences"
import { PAGE_SIZE } from "../../common/build/constants"

dotenv.config()

export const SORT_PATTERN = "(([-+ ]?\w+,)*[-+ ]?\w+)?"
export const processErrors = (errors?: ErrorObject[] | null): string | undefined =>
    errors?.map(err => err.message ?? "").join(" / ")

const ajv = new Ajv({ allErrors: true, strict: true, coerceTypes: true })
ajvErrors(ajv)

const ajvJTD = new AjvJTD({ allErrors: true })
ajvJTD.addKeyword({
    keyword: "minimum",
    compile: minimum => {
        if (typeof minimum !== "number") throw new Error("minimum value must be a number")
        return data => typeof data === "number" && data >= minimum
    },
    error: { message: ({ schema: minimum }) => `must be >= ${minimum}` }
})
ajvJTD.addKeyword({
    keyword: "maximum",
    compile: maximum => {
        if (typeof maximum !== "number") throw new Error("maximum value must be a number")
        return data => typeof data === "number" && data <= maximum
    },
    error: { message: ({ schema: maximum }) => `must be <= ${maximum}` }
})
const boundToMeta = (bound: Bound) => ({ minimum: bound.min, maximum: bound.max })

const searchQueryProperties: PropertiesSchema<SearchQuery> = {
    page: { type: "integer", nullable: true, minimum: 1 },
    limit: { type: "integer", nullable: true, maximum: PAGE_SIZE },
    sort: { type: "string", nullable: true, pattern: SORT_PATTERN }
}
const searchQueryErrorMessages = {
    properties: {
        sort: "must be a comma separated list of field names optionally prefixed by a '+' or '-'"
    }
}
const searchQuerySchema: JSONSchemaType<SearchQuery> = {
    type: "object",
    properties: searchQueryProperties,
    errorMessage: searchQueryErrorMessages
}
export const searchQueryValidator = ajv.compile(searchQuerySchema)

const usersQuerySchema: JSONSchemaType<UsersQuery> = {
    type: "object",
    properties: {
        ...searchQueryProperties,
        username: { type: "string", nullable: true },
        email: { type: "string", nullable: true },
        firstName: { type: "string", nullable: true },
        lastName: { type: "string", nullable: true }
    },
    errorMessage: searchQueryErrorMessages
}
export const usersQueryValidator = ajv.compile(usersQuerySchema)

const digestAlgorithmPreferencesSchema: JTDSchemaType<DigestAlgorithmPreferences> = {
    optionalProperties: {
        digestAlgorithm: { enum: DIGEST_ALGORITHMS.slice() }
    }
}

const saltPreferencesSchema: JTDSchemaType<SaltPreferences> = {
    optionalProperties: {
        saltLength: { type: "uint32", metadata: boundToMeta(SALT_PREFERENCES_BOUNDS.saltLength) }
    }
}

const hashPreferencesSchema: JTDSchemaType<HashPreferences> = {
    discriminator: "algorithm",
    mapping: {
        "Plain Hash": digestAlgorithmPreferencesSchema,
        "Plain Hash+Salt": {
            optionalProperties: {
                ...digestAlgorithmPreferencesSchema.optionalProperties,
                ...saltPreferencesSchema.optionalProperties
            }
        },
        "HMAC": {
            optionalProperties: {
                ...digestAlgorithmPreferencesSchema.optionalProperties,
                ...saltPreferencesSchema.optionalProperties
            }
        },
        "PBKDF2": {
            optionalProperties: {
                ...digestAlgorithmPreferencesSchema.optionalProperties,
                ...saltPreferencesSchema.optionalProperties,
                iterations: { type: "uint32", metadata: boundToMeta(PBKDF2_PREFERENCES_BOUNDS.iterations) },
                hashLength: { type: "uint32", metadata: boundToMeta(PBKDF2_PREFERENCES_BOUNDS.hashLength) }
            }
        },
        "BCrypt": {
            optionalProperties: {
                minorVersion: { enum: BCRYPT_MINOR_VERSIONS.slice() },
                rounds: { type: "uint32", metadata: boundToMeta(BCRYPT_PREFERENCES_BOUNDS.rounds) }
            }
        },
        "SCrypt": {
            optionalProperties: {
                hashLength: { type: "uint32", metadata: boundToMeta(SCRYPT_PREFERENCES_BOUNDS.hashLength) },
                saltLength: { type: "uint32", metadata: boundToMeta(SCRYPT_PREFERENCES_BOUNDS.saltLength) },
                cost: { type: "uint32", metadata: boundToMeta(SCRYPT_PREFERENCES_BOUNDS.cost) },
                blockSize: { type: "uint32", metadata: boundToMeta(SCRYPT_PREFERENCES_BOUNDS.blockSize) },
                parallelization: { type: "uint32", metadata: boundToMeta(SCRYPT_PREFERENCES_BOUNDS.parallelization) }
            }
        },
        "Argon2": {
            optionalProperties: {
                type: { enum: ARGON2_TYPES.slice() },
                version: { enum: ARGON2_VERSIONS.slice() },
                hashLength: { type: "uint32", metadata: boundToMeta(ARGON2_PREFERENCES_BOUNDS.hashLength) },
                saltLength: { type: "uint32", metadata: boundToMeta(ARGON2_PREFERENCES_BOUNDS.saltLength) },
                memoryCost: { type: "uint32", metadata: boundToMeta(ARGON2_PREFERENCES_BOUNDS.memoryCost) },
                timeCost: { type: "uint32", metadata: boundToMeta(ARGON2_PREFERENCES_BOUNDS.timeCost) },
                parallelism: { type: "uint32", metadata: boundToMeta(ARGON2_PREFERENCES_BOUNDS.parallelism) }
            }
        }
    }
}
export const hashPreferencesValidator = ajvJTD.compile(hashPreferencesSchema)

const userCreateSchema: JTDSchemaType<UserCreateRequest> = {
    properties: {
        username: { type: "string" },
        email: { type: "string" },
        firstName: { type: "string" },
        password: { type: "string" }
    },
    optionalProperties: {
        lastName: { type: "string" },
        hashPreferences: hashPreferencesSchema
    }
}
export const userCreateValidator = ajvJTD.compile(userCreateSchema)

const userReplaceSchema: JTDSchemaType<UserReplaceRequest> = {
    properties: {
        username: { type: "string" },
        email: { type: "string" },
        firstName: { type: "string" }
    },
    optionalProperties: {
        lastName: { type: "string" },
        password: { type: "string" },
        hashPreferences: hashPreferencesSchema
    }
}
export const userReplaceValidator = ajvJTD.compile(userReplaceSchema)

const userUpdateSchema: JTDSchemaType<UserUpdateRequest> = {
    optionalProperties: {
        username: { type: "string" },
        email: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        password: { type: "string" },
        hashPreferences: hashPreferencesSchema
    }
}
export const userUpdateValidator = ajvJTD.compile(userUpdateSchema)

const userAuthenticateSchema: JTDSchemaType<UserAuthenticateRequest> = {
    properties: {
        identifier: { type: "string" },
        password: { type: "string" }
    }
}
export const userAuthenticateValidator = ajvJTD.compile(userAuthenticateSchema)
