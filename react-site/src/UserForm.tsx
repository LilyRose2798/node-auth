import { useState, FunctionComponent } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { removeEmptyFields } from "./util"
import { UserPrivate, UserCreateRequest, UserReplaceRequest } from "../../common/src/API"
import { UserInfo } from "../../common/src/User"
import { HashPreferences, PBKDF2_PREFERENCES_BOUNDS, BCRYPT_PREFERENCES_BOUNDS, SCRYPT_PREFERENCES_BOUNDS, ARGON2_PREFERENCES_BOUNDS, DIGEST_ALGORITHMS, SALT_PREFERENCES_BOUNDS, BCRYPT_MINOR_VERSIONS, ARGON2_TYPES, ARGON2_VERSIONS } from "../../common/src/HashPreferences"
import { FormInput, FormSelect, FormSelectInfo } from "./FormUtils"

type UserCreateFormData = UserCreateRequest & { passwordConfirmation: UserCreateRequest["password"] }
type UserReplaceFormData = UserReplaceRequest & { passwordConfirmation?: UserReplaceRequest["password"] }

type UserCreateFormProps = { submitText: string, onSubmit: SubmitHandler<UserCreateRequest> }
type UserReplaceFormProps = { submitText: string, user?: UserPrivate, onSubmit: SubmitHandler<UserReplaceRequest> }
type UserFormProps = (UserCreateFormProps & { create: true, submitText: string, user?: undefined }) | (UserReplaceFormProps & { create: false })

const sanitizeUser = (user: UserPrivate): UserInfo => {
    const { id, passwordHash, ...userInfo } = user
    return userInfo
}

export const UserCreateForm: FunctionComponent<UserCreateFormProps> = props => UserForm({ create: true, ...props })
export const UserReplaceForm: FunctionComponent<UserReplaceFormProps> = props => UserForm({ create: false, ...props })
export const UserForm: FunctionComponent<UserFormProps> = ({ create, submitText, user, onSubmit }) => {
    type FormData = typeof onSubmit extends SubmitHandler<UserCreateRequest> ? UserCreateFormData : UserReplaceFormData
    const userInfo = user && sanitizeUser(user)
    const { register, handleSubmit, watch } = useForm<FormData>({ defaultValues: userInfo, shouldUnregister: true })
    const algorithmWatch = watch("hashPreferences.algorithm") as HashPreferences["algorithm"] | ""
    const [showPassword, setShowPassword] = useState(false)
    const [passwordErrorMessage, setPaswordErrorMessage] = useState("")
    const onSubmitHandler = handleSubmit(data => {
        const { passwordConfirmation, ...userData } = data
        if (create && (userData.password === undefined || passwordConfirmation === undefined))
            return setPaswordErrorMessage("Password is required")
        if (userData.password !== passwordConfirmation)
            return setPaswordErrorMessage("Passwords do not match")
        removeEmptyFields(userData)
        console.log(userData)
        return onSubmit(userData)
    })

    
    const PreferencesFormSelect = <T,>({ values, ...props }: FormSelectInfo<T> & { values: readonly any[] }) => (
        <FormSelect {...props}>
            <option value="">No preference</option>
            {values.map(v => <option value={v}>{v}</option>)}
        </FormSelect>
    )
    
    const DigestAlgorithmInput: FunctionComponent = () =>
        <PreferencesFormSelect field="hashPreferences.digestAlgorithm" label="Digest Algorithm" values={DIGEST_ALGORITHMS} register={register} />

    const SaltLengthInput: FunctionComponent = () =>
        <FormInput field="hashPreferences.saltLength" label="Salt Length" type="number" {...SALT_PREFERENCES_BOUNDS.saltLength} register={register} />

    const PlainHashPreferencesForm: FunctionComponent = () =>
        <DigestAlgorithmInput />

    const PlainHashSaltPreferencesForm: FunctionComponent = () => (<>
        <DigestAlgorithmInput />
        <SaltLengthInput />
    </>)

    const HMACPreferencesForm: FunctionComponent = () => (<>
        <DigestAlgorithmInput />
        <SaltLengthInput />
    </>)

    const PBKDF2PreferencesForm: FunctionComponent = () => (<>
        <DigestAlgorithmInput />
        <SaltLengthInput />
        <FormInput field="hashPreferences.iterations" label="Iterations" type="number" {...PBKDF2_PREFERENCES_BOUNDS.iterations} register={register} />
        <FormInput field="hashPreferences.hashLength" label="Hash Length" type="number" {...PBKDF2_PREFERENCES_BOUNDS.hashLength} register={register} />
    </>)

    const BCryptForm: FunctionComponent = () => (<>
        <PreferencesFormSelect field="hashPreferences.minorVersion" label="Minor Version" values={BCRYPT_MINOR_VERSIONS} register={register} />
        <FormInput field="hashPreferences.rounds" label="Salt Rounds" type="number" {...BCRYPT_PREFERENCES_BOUNDS.rounds} register={register} />
    </>)

    const SCryptForm: FunctionComponent = () => (<>
        <FormInput field="hashPreferences.hashLength" label="Hash Length" type="number" {...SCRYPT_PREFERENCES_BOUNDS.hashLength} register={register} />
        <FormInput field="hashPreferences.saltLength" label="Salt Length" type="number" {...SCRYPT_PREFERENCES_BOUNDS.saltLength} register={register} />
        <FormInput field="hashPreferences.cost" label="Cost" type="number" {...SCRYPT_PREFERENCES_BOUNDS.cost} register={register} />
        <FormInput field="hashPreferences.blockSize" label="Block Size" type="number" {...SCRYPT_PREFERENCES_BOUNDS.blockSize} register={register} />
        <FormInput field="hashPreferences.parallelization" label="Parallelization" type="number" {...SCRYPT_PREFERENCES_BOUNDS.parallelization} register={register} />
    </>)

    const Argon2Form: FunctionComponent = () => (<>
        <PreferencesFormSelect field="hashPreferences.type" label="Type" values={ARGON2_TYPES} register={register} />
        <PreferencesFormSelect field="hashPreferences.version" label="Version" values={ARGON2_VERSIONS} register={register} />
        <FormInput field="hashPreferences.hashLength" label="Hash Length" type="number" {...ARGON2_PREFERENCES_BOUNDS.hashLength} register={register} />
        <FormInput field="hashPreferences.saltLength" label="Salt Length" type="number" {...ARGON2_PREFERENCES_BOUNDS.saltLength} register={register} />
        <FormInput field="hashPreferences.memoryCost" label="Memory Cost" type="number" {...ARGON2_PREFERENCES_BOUNDS.memoryCost} register={register} />
        <FormInput field="hashPreferences.timeCost" label="Time Cost" type="number" {...ARGON2_PREFERENCES_BOUNDS.timeCost} register={register} />
        <FormInput field="hashPreferences.parallelism" label="Parallelism" type="number" {...ARGON2_PREFERENCES_BOUNDS.parallelism} register={register} />
    </>)

    const hashPreferencesForms: { [T in HashPreferences["algorithm"]]: JSX.Element } = {
        "Plain Hash": <PlainHashPreferencesForm  />,
        "Plain Hash+Salt": <PlainHashSaltPreferencesForm />,
        "HMAC": <HMACPreferencesForm />,
        "PBKDF2": <PBKDF2PreferencesForm />,
        "BCrypt": <BCryptForm />,
        "SCrypt": <SCryptForm />,
        "Argon2": <Argon2Form />
    }

    return (
        <form className="edit-profile-form" onSubmit={onSubmitHandler}>
            <FormInput field="username" label="Username" required={true} autoComplete="username" spellCheck={false} autoCapitalize="none" register={register} />
            <FormInput field="email" label="Email" type="email" required={true} autoComplete="email" spellCheck={false} autoCapitalize="none" register={register} />
            <FormInput field="firstName" label="First Name" required={true} autoComplete="given-name" spellCheck={false} autoCapitalize="none" register={register} />
            <FormInput field="lastName" label="Last Name" autoComplete="family-name" spellCheck={false} autoCapitalize="none" register={register} />
            <details>
                <summary>Hash Preferences</summary>
                <FormSelect field="hashPreferences.algorithm" label="Algorithm" register={register}>
                    <option value="">No preference</option>
                    {Object.keys(hashPreferencesForms).map(algorithm => <option value={algorithm}>{algorithm}</option>)}
                </FormSelect>
                {algorithmWatch && hashPreferencesForms[algorithmWatch]}
            </details>
            <FormInput field="password" label="New Password" type={showPassword ? "text" : "password"} required={create} autoComplete="new-password" spellCheck={false} autoCapitalize="none" register={register} />
            <FormInput field="passwordConfirmation" label="Confirm New Password" type={showPassword ? "text" : "password"} required={create} autoComplete="new-password" spellCheck={false} autoCapitalize="none" register={register}>
                <span className="error-message">{passwordErrorMessage}</span>
                <input id="show-password-input" type="checkbox" aria-label="Show password" onChange={e => setShowPassword(e.target.checked)} />
                <label className="inline-label" htmlFor="show-password-input">Show password</label>
            </FormInput>
            <div className="button-div">
                <button type="submit">{submitText}</button>
            </div>
        </form>
    )
}

export default UserForm
