import bcrypt from "bcrypt"
import argon2 from "argon2"
import crypto from "crypto"
import phc from "@phc/format"
import { promisify } from "util"
import HashPreferences, { DIGEST_ALGORITHMS_SET, DigestAlgorithm, DEFAULT_DIGEST_ALGORITHM_HASH_LENGTHS, IDENTIFIER_DIGEST_ALGORITHM_MAP, DIGEST_ALGORITHM_IDENTIFIERS, DEFAULT_HASH_PREFERENCES, HMAC_ID_PREFIX, PBKDF2_ID_PREFIX, DEFAULT_PLAIN_HASH_PREFERENCES, DEFAULT_PLAIN_HASH_SALT_PREFERENCES, DEFAULT_HMAC_PREFERENCES, DEFAULT_PBKDF2_PREFERENCES, DEFAULT_BCRYPT_PREFERENCES, DEFAULT_SCRYPT_PREFERENCES, Argon2Type, Argon2Version, ARGON2_NUMBER_VERSION_MAP, ARGON2_TYPE_NUMBERS, ARGON2_VERSION_NUMBERS } from "../../common/build/HashPreferences"

const randomBytes = promisify(crypto.randomBytes)
const generateSalt = (saltLength: number) => randomBytes(saltLength)
const pbkdf2 = promisify(crypto.pbkdf2)
const scryptHash = (password: string, salt: Buffer, hashLength: number, options: crypto.ScryptOptions) =>
    new Promise(async (resolve: (value: Buffer) => void, reject: (error: Error) => void) => {
        crypto.scrypt(password, salt, hashLength, options, (err, hash) => {
            if (err) return reject(err)
            return resolve(hash)
        })
    })
const hmac = (password: string, salt: Buffer, algorithm: string) => crypto.createHmac(algorithm, salt).update(password).digest()
const hash = (password: string, algorithm: string) => crypto.createHash(algorithm).update(password).digest()
const saltedHash = (password: string, salt: Buffer, algorithm: string) => crypto.createHash(algorithm).update(password).update(salt).digest()
const toBase64 = (buf: Buffer) => buf.toString("base64").split("=")[0]
const fromBase64 = (base64: string) => Buffer.from(base64, "base64")
const strToNum = (x?: string) => x === undefined ? undefined : (n => isNaN(n) ? undefined : n)(Number(x))
const stringIsDigestAlgorithm = (str: string): str is DigestAlgorithm => DIGEST_ALGORITHMS_SET.has(str as DigestAlgorithm)
const prefixedIdToDigestAlgorithm = (prefixedId: string, prefix: string): DigestAlgorithm => {
    const id = prefixedId.slice(prefix.length).toUpperCase()
    if (!stringIsDigestAlgorithm(id)) throw new Error("Invalid digest algorithm")
    return id
}

export type DeepRequired<T> = { [P in keyof T]-?: DeepRequired<T[P]> }

export const getHashPreferences = (passwordHash: string): DeepRequired<HashPreferences> => {
    if (passwordHash[0] !== "$") throw new Error("Invalid password hash")
    const parts = passwordHash.slice(1).split("$")
    const numParts = parts.length
    if (numParts < 2) throw new Error("Invalid password hash")
    const id = parts[0]

    if (/^2[ab]$/.test(id)) {
        const minorVersion = id[1] as "a" | "b"
        const rounds = strToNum(parts[1])
        if (rounds === undefined) throw new Error("Invalid password hash")
        return {
            algorithm: "BCrypt",
            minorVersion,
            rounds
        }
    } else if (id === "s2") {
        const phcOpts = phc.deserialize(passwordHash)
        const hashLength = phcOpts.hash?.length
        const saltLength = phcOpts.salt?.length
        const { n, r, p } = phcOpts.params as { n?: string, r?: string, p?: string }
        const [cost, blockSize, parallelization] = [n, r, p].map(strToNum)
        if (hashLength === undefined || saltLength === undefined || cost === undefined || blockSize === undefined || parallelization === undefined) throw new Error("Invalid password hash")
        return {
            algorithm: "SCrypt",
            hashLength,
            saltLength,
            cost,
            blockSize,
            parallelization
        }
    } else if (/^argon2(d|i|id)$/.test(id)) {
        const type = id.slice(6) as Argon2Type
        const phcOpts = phc.deserialize(passwordHash)
        const version = phcOpts.version ? ARGON2_NUMBER_VERSION_MAP.get(phcOpts.version) : undefined
        const hashLength = phcOpts.hash?.length
        const saltLength = phcOpts.salt?.length
        const { m, t, p } = phcOpts.params as { m?: string, t?: string, p?: string, data?: string }
        const [memoryCost, timeCost, parallelism] = [m, t, p].map(strToNum)
        if (version === undefined || hashLength === undefined || saltLength === undefined || memoryCost === undefined || timeCost === undefined || parallelism === undefined) throw new Error("Invalid password hash")
        return {
            algorithm: "Argon2",
            type,
            version,
            hashLength,
            saltLength,
            memoryCost,
            timeCost,
            parallelism
        }
    } else if (id.startsWith(HMAC_ID_PREFIX)) {
        if (parts.length < 3) throw new Error("Invalid password hash")
        const digestAlgorithm = prefixedIdToDigestAlgorithm(id, HMAC_ID_PREFIX)
        const saltLength = fromBase64(parts[2]).length
        return {
            algorithm: "HMAC",
            digestAlgorithm,
            saltLength
        }
    } else if (id.startsWith(PBKDF2_ID_PREFIX)) {
        if (parts.length < 4) throw new Error("Invalid password hash")
        const digestAlgorithm = prefixedIdToDigestAlgorithm(id, PBKDF2_ID_PREFIX)
        const saltLength = fromBase64(parts[2]).length
        const iterations = strToNum(parts[1]) ?? DEFAULT_PBKDF2_PREFERENCES.iterations
        const hashLength = fromBase64(parts[3]).length
        return {
            algorithm: "PBKDF2",
            digestAlgorithm,
            saltLength,
            iterations,
            hashLength
        }
    } else {
        const digestAlgorithm = IDENTIFIER_DIGEST_ALGORITHM_MAP.get(id)
        if (digestAlgorithm === undefined) throw new Error("Unknown hash algorithm")
        return parts.length === 2 ? {
            algorithm: "Plain Hash",
            digestAlgorithm
        } : {
            algorithm: "Plain Hash+Salt",
            digestAlgorithm,
            saltLength: fromBase64(parts[1]).length
        }
    }
}

export const hashPassword = async (password: string, hashPreferences: HashPreferences = DEFAULT_HASH_PREFERENCES): Promise<string> => {
    switch (hashPreferences.algorithm) {
        case "Plain Hash": {
            const { digestAlgorithm } = { ...DEFAULT_PLAIN_HASH_PREFERENCES, ...hashPreferences }
            return `$${DIGEST_ALGORITHM_IDENTIFIERS[digestAlgorithm]}$${toBase64(hash(password, digestAlgorithm.toLowerCase()))}`
        }
        case "Plain Hash+Salt": {
            const { digestAlgorithm, saltLength } = { ...DEFAULT_PLAIN_HASH_SALT_PREFERENCES, ...hashPreferences }
            const salt = await generateSalt(saltLength)
            return `$${DIGEST_ALGORITHM_IDENTIFIERS[digestAlgorithm]}$${toBase64(salt)}$${toBase64(saltedHash(password, salt, digestAlgorithm.toLowerCase()))}`
        }
        case "HMAC": {
            const { digestAlgorithm, saltLength } = { ...DEFAULT_HMAC_PREFERENCES, ...hashPreferences }
            const salt = await generateSalt(saltLength)
            return `$${HMAC_ID_PREFIX}${digestAlgorithm.toLowerCase()}$${toBase64(salt)}$${toBase64(hmac(password, salt, digestAlgorithm.toLowerCase()))}`
        }
        case "PBKDF2": {
            const { digestAlgorithm, saltLength, iterations, hashLength } = { ...DEFAULT_PBKDF2_PREFERENCES, ...hashPreferences }
            const salt = await generateSalt(saltLength)
            const hash = await pbkdf2(password, salt, iterations, hashLength ?? DEFAULT_DIGEST_ALGORITHM_HASH_LENGTHS[digestAlgorithm], digestAlgorithm.toLowerCase())
            return `$${PBKDF2_ID_PREFIX}${digestAlgorithm.toLowerCase()}$${iterations}$${toBase64(salt)}$${toBase64(hash)}`
        }
        case "BCrypt": {
            const { minorVersion, rounds } = { ...DEFAULT_BCRYPT_PREFERENCES, ...hashPreferences }
            return bcrypt.hash(password, await bcrypt.genSalt(rounds, minorVersion))
        }
        case "SCrypt": {
            const { algorithm, hashLength, saltLength, ...options } = { ...DEFAULT_SCRYPT_PREFERENCES, ...hashPreferences }
            const salt = await generateSalt(saltLength)
            const hash = await scryptHash(password, salt, hashLength, options)
            return phc.serialize({ id: "s2", params: { n: options.cost, r: options.blockSize, p: options.parallelization }, salt, hash })
        }
        case "Argon2": {
            const { algorithm, type, version, ...options } = hashPreferences
            const typeNum = type && ARGON2_TYPE_NUMBERS[type]
            const versionNum = version && ARGON2_VERSION_NUMBERS[version]
            return argon2.hash(password, { type: typeNum, version: versionNum, ...options })
        }
    }
}

export const verifyPassword = async (password: string, passwordHash: string, passwordHashPreferences?: DeepRequired<HashPreferences>): Promise<boolean> => {
    const hashPrefs = passwordHashPreferences ?? getHashPreferences(passwordHash)
    const parts = passwordHash.slice(1).split("$")
    switch (hashPrefs.algorithm) {
        case "Plain Hash": return crypto.timingSafeEqual(hash(password, hashPrefs.digestAlgorithm.toLowerCase()), fromBase64(parts[1]))
        case "Plain Hash+Salt": return crypto.timingSafeEqual(saltedHash(password, fromBase64(parts[1]), hashPrefs.digestAlgorithm.toLowerCase()), fromBase64(parts[2]))
        case "HMAC": return crypto.timingSafeEqual(hmac(password, fromBase64(parts[1]), hashPrefs.digestAlgorithm.toLowerCase()), fromBase64(parts[2]))
        case "PBKDF2": {
            const targetHash = fromBase64(parts[3])
            return crypto.timingSafeEqual(await pbkdf2(password, fromBase64(parts[2]), hashPrefs.iterations, targetHash.length, hashPrefs.digestAlgorithm.toLowerCase()), targetHash)
        }
        case "BCrypt": return bcrypt.compare(password, passwordHash)
        case "SCrypt": {
            const { algorithm, hashLength, saltLength, ...options } = hashPrefs
            const targetHash = fromBase64(parts[0])
            const salt = fromBase64(parts[1])
            return crypto.timingSafeEqual(await scryptHash(password, salt, targetHash.length, options), targetHash)
        }
        case "Argon2": {
            const { algorithm, type, version, ...options } = hashPrefs
            const typeNum = type && ARGON2_TYPE_NUMBERS[type]
            const versionNum = version && ARGON2_VERSION_NUMBERS[version]
            return argon2.verify(passwordHash, password, { type: typeNum, version: versionNum, ...options })
        }
    }
}

export const needsRehash = async (passwordHash: string, userHashPreferences: HashPreferences = DEFAULT_HASH_PREFERENCES, passwordHashPreferences?: DeepRequired<HashPreferences>): Promise<boolean> => {
    const passwordHashPrefs = passwordHashPreferences ?? getHashPreferences(passwordHash)
    switch (passwordHashPrefs.algorithm) {
        case "Plain Hash": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_PLAIN_HASH_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.digestAlgorithm !== passwordHashPrefs.digestAlgorithm
        }
        case "Plain Hash+Salt": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_PLAIN_HASH_SALT_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.digestAlgorithm !== passwordHashPrefs.digestAlgorithm ||
                   userHashPrefs.saltLength !== passwordHashPrefs.saltLength
        }
        case "HMAC": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_HMAC_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.digestAlgorithm !== passwordHashPrefs.digestAlgorithm ||
                   userHashPrefs.saltLength !== passwordHashPrefs.saltLength
        }
        case "PBKDF2": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_PBKDF2_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.digestAlgorithm !== passwordHashPrefs.digestAlgorithm ||
                   userHashPrefs.saltLength !== passwordHashPrefs.saltLength ||
                   userHashPrefs.iterations !== passwordHashPrefs.iterations ||
                   userHashPrefs.hashLength !== passwordHashPrefs.hashLength
        }
        case "BCrypt": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_BCRYPT_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.minorVersion !== passwordHashPrefs.minorVersion ||
                   userHashPrefs.rounds !== passwordHashPrefs.rounds
        }
        case "SCrypt": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const userHashPrefs = { ...DEFAULT_SCRYPT_PREFERENCES, ...userHashPreferences }
            return userHashPrefs.hashLength !== passwordHashPrefs.hashLength ||
                   userHashPrefs.saltLength !== passwordHashPrefs.saltLength ||
                   userHashPrefs.cost !== passwordHashPrefs.cost ||
                   userHashPrefs.blockSize !== passwordHashPrefs.blockSize ||
                   userHashPrefs.parallelization !== passwordHashPrefs.parallelization
        }
        case "Argon2": {
            if (userHashPreferences.algorithm !== passwordHashPrefs.algorithm) return true
            const { algorithm, type, version, ...options } = userHashPreferences
            const typeNum = type && ARGON2_TYPE_NUMBERS[type]
            const versionNum = version && ARGON2_VERSION_NUMBERS[version]
            return argon2.needsRehash(passwordHash, { type: typeNum, version: versionNum, ...options })
        }
    }
}
