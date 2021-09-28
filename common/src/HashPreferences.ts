
export const DIGEST_ALGORITHMS = ["MD5", "SHA1", "SHA256", "SHA512"] as const
export const DIGEST_ALGORITHMS_SET: Set<DigestAlgorithm> = new Set(DIGEST_ALGORITHMS)
export type DigestAlgorithm = typeof DIGEST_ALGORITHMS[number]

type HashPreferencesType<T extends string, U extends object = {}> = { algorithm: T } & U

export type DigestAlgorithmPreferences = { digestAlgorithm?: DigestAlgorithm }
export type SaltPreferences = { saltLength?: number }

export type PlainHashPreferences = HashPreferencesType<"Plain Hash", DigestAlgorithmPreferences>

export type PlainHashSaltPreferences = HashPreferencesType<"Plain Hash+Salt", DigestAlgorithmPreferences & SaltPreferences>

export type HMACPreferences = HashPreferencesType<"HMAC", DigestAlgorithmPreferences & SaltPreferences>

export type PBKDF2Preferences = HashPreferencesType<"PBKDF2", DigestAlgorithmPreferences & SaltPreferences & {
    iterations?: number
    hashLength?: number
}>

export const BCRYPT_MINOR_VERSIONS = ["a", "b"] as const
export type BCryptMinorVersion = typeof BCRYPT_MINOR_VERSIONS[number]

export type BCryptPreferences = HashPreferencesType<"BCrypt", {
    minorVersion?: BCryptMinorVersion
    rounds?: number
}>

export type SCryptPreferences = HashPreferencesType<"SCrypt", SaltPreferences & {
    hashLength?: number
    cost?: number
    blockSize?: number
    parallelization?: number
}>

export const ARGON2_TYPES = ["d", "id", "i"] as const
export type Argon2Type = typeof ARGON2_TYPES[number]
export const ARGON2_TYPE_NUMBERS: { [T in Argon2Type]: 0 | 1 | 2 } = {
    "d": 0,
    "id": 1,
    "i": 2
}

export const ARGON2_VERSIONS = ["1.0", "1.3"] as const
export type Argon2Version = typeof ARGON2_VERSIONS[number]
export const ARGON2_VERSION_NUMBERS: { [T in Argon2Version]: number } = {
    "1.0": 0x10,
    "1.3": 0x13
}
export const ARGON2_NUMBER_VERSION_MAP: Map<number, Argon2Version> = new Map([
    [0x10, "1.0"],
    [0x13, "1.3"]
])

export type Argon2Preferences = HashPreferencesType<"Argon2", SaltPreferences & {
    type?: Argon2Type
    version?: Argon2Version
    hashLength?: number
    memoryCost?: number
    timeCost?: number
    parallelism?: number
}>

export type Bound = { min: number, max: number }
export type Bounds<T extends object> = { [K in { [K in keyof Required<T>]: Required<T>[K] extends number ? K : never }[keyof T]]: Bound }
const bound = (min: number, max: number): Bound => ({ min, max })

const MAX_UINT32 = 2 ** 32 - 1
const MAX_INT32 = 2 ** 31 - 1
const MAX_UINT24 = 2 ** 24 - 1
const UINT32_BOUND = bound(0, MAX_UINT32)

export const SALT_PREFERENCES_BOUNDS: Bounds<SaltPreferences> = {
    saltLength: bound(0, MAX_INT32)
} as const

export const PBKDF2_PREFERENCES_BOUNDS: Bounds<Omit<PBKDF2Preferences, keyof SaltPreferences>> = {
    iterations: bound(1, MAX_UINT32),
    hashLength: UINT32_BOUND
} as const

export const BCRYPT_PREFERENCES_BOUNDS: Bounds<BCryptPreferences> = {
    rounds: bound(1, 31)
} as const

export const SCRYPT_PREFERENCES_BOUNDS: Bounds<SCryptPreferences> = {
    hashLength: UINT32_BOUND,
    saltLength: bound(0, MAX_INT32),
    cost: UINT32_BOUND,
    blockSize: UINT32_BOUND,
    parallelization: UINT32_BOUND
} as const

export const ARGON2_PREFERENCES_BOUNDS: Bounds<Argon2Preferences> = {
    hashLength: bound(4, MAX_UINT32),
    saltLength: bound(8, MAX_INT32),
    memoryCost: bound(2048, MAX_UINT32),
    timeCost: bound(2, MAX_UINT32),
    parallelism: bound(1, MAX_UINT24)
} as const

export type Defaults<T extends object> = Required<Pick<T, Exclude<{ [K in keyof T]: T extends Record<K, T[K]> ? never : K }[keyof T], undefined>>>

export const DEFAULT_DIGEST_ALGORITHM: DigestAlgorithm = "SHA512"
export const DEFAULT_DIGEST_ALGORITHM_PREFERENCES: Defaults<DigestAlgorithmPreferences> = { digestAlgorithm: DEFAULT_DIGEST_ALGORITHM }

export const DEFAULT_SALT_PREFERENCES: Defaults<SaltPreferences> = {
    saltLength: 16
} as const

export const DEFAULT_PLAIN_HASH_PREFERENCES: Defaults<PlainHashPreferences> = DEFAULT_DIGEST_ALGORITHM_PREFERENCES

export const DEFAULT_PLAIN_HASH_SALT_PREFERENCES: Defaults<PlainHashSaltPreferences> = {
    ...DEFAULT_DIGEST_ALGORITHM_PREFERENCES,
    ...DEFAULT_SALT_PREFERENCES
}

export const DEFAULT_HMAC_PREFERENCES: Defaults<HMACPreferences> = {
    ...DEFAULT_DIGEST_ALGORITHM_PREFERENCES,
    ...DEFAULT_SALT_PREFERENCES
}

export const DEFAULT_PBKDF2_PREFERENCES: Defaults<Omit<PBKDF2Preferences, "hashLength">> = {
    ...DEFAULT_DIGEST_ALGORITHM_PREFERENCES,
    ...DEFAULT_SALT_PREFERENCES,
    iterations: 1
} as const


export const DEFAULT_BCRYPT_PREFERENCES: Defaults<BCryptPreferences> = {
    minorVersion: "b",
    rounds: 10
} as const

export const DEFAULT_SCRYPT_PREFERENCES: Defaults<SCryptPreferences> = {
    ...DEFAULT_SALT_PREFERENCES,
    hashLength: 32,
    cost: 16384,
    blockSize: 8,
    parallelization: 1
} as const

export const DEFAULT_HASH_PREFERENCES: HashPreferences = {
    algorithm: "Argon2"
} as const

export const DEFAULT_DIGEST_ALGORITHM_HASH_LENGTHS: { [T in DigestAlgorithm]: number } = {
    "MD5": 16,
    "SHA1": 20,
    "SHA256": 32,
    "SHA512": 64
} as const

const IDENTIFIERS = ["1", "sha1", "5", "6"] as const
type Identifier = typeof IDENTIFIERS[number]
export const IDENTIFIER_DIGEST_ALGORITHM_MAP: Map<string, DigestAlgorithm> = new Map(IDENTIFIERS.map((x, i): [Identifier, DigestAlgorithm] => [x, DIGEST_ALGORITHMS[i]]))
export const DIGEST_ALGORITHM_IDENTIFIERS: { [T in DigestAlgorithm]: Identifier } = {
    "MD5": "1",
    "SHA1": "sha1",
    "SHA256": "5",
    "SHA512": "6"
} as const

export const PBKDF2_ID_PREFIX = "pbkdf2-"
export const HMAC_ID_PREFIX = "hmac-"

export type HashPreferences = PlainHashPreferences | PlainHashSaltPreferences | HMACPreferences | PBKDF2Preferences | BCryptPreferences | SCryptPreferences | Argon2Preferences

type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V> ? T : never
export type DiscriminateHashPreferences<T extends HashPreferences["algorithm"]> = DiscriminateUnion<HashPreferences, "algorithm", T>

export default HashPreferences
