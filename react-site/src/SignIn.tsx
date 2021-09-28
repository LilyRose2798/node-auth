import { useState, FunctionComponent, useContext } from "react"
import { useHistory, useLocation, Link } from "react-router-dom"
import { Location } from "history"
import { useForm } from "react-hook-form"
import { authContext } from "./App"
import { apiPOST } from "./util"
import { UserAuthenticateRequest } from "../../common/src/API"
import { FormInput } from "./FormUtils"

interface LocationState {
    from: Location
}

export const SignIn: FunctionComponent = () => {
    const history = useHistory()
    const location = useLocation<LocationState>()
    const auth = useContext(authContext)
    const { register, handleSubmit } = useForm<UserAuthenticateRequest>()

    const { from } = location.state ?? { from: { pathname: "/" } }
    const onSubmit = handleSubmit(async data => {
        clearErrorMessages()
        apiPOST("/auth", data).then(res => {
            if (res.data.success) {
                auth.setSignedIn(true)
                history.replace(from)
            } else if (res.status === 404)
                setIdentifierErrorMessage(res.data.message)
            else if (res.status === 400)
                setPasswordErrorMessage(res.data.message)
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))
    })
    const [identifierErrorMessage, setIdentifierErrorMessage] = useState("")
    const [passwordErrorMessage, setPasswordErrorMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const clearErrorMessages = () => {
        setIdentifierErrorMessage("")
        setPasswordErrorMessage("")
        setErrorMessage("")
    }
    const [showPassword, setShowPassword] = useState(false)
    
    return (
        <div className="info-div">
            <div className="info-inner">
                <h1>Sign In</h1>
                <form className="signin-form" onSubmit={onSubmit}>
                    <FormInput field="identifier" label="Username or Email" required={true} autoComplete="username" spellCheck={false} autoCapitalize="none" register={register}>
                        <span className="error-message">{identifierErrorMessage}</span>
                    </FormInput>
                    <FormInput field="password" label="Password" type={showPassword ? "text" : "password"} required={true} autoComplete="current-password" spellCheck={false} autoCapitalize="none" register={register}>
                        <span className="error-message">{passwordErrorMessage}</span>
                        <input id="show-password-input" type="checkbox" aria-label="Show password" onChange={e => setShowPassword(e.target.checked)} />
                        <label className="inline-label" htmlFor="show-password-input">Show password</label>
                    </FormInput>
                    <div className="button-div flex-row-reverse">
                        <div className="align-right flex-grow-1">
                            <button type="submit">Sign In</button>
                        </div>
                        <div className="flex-grow-1">
                            <Link to="/signup" className="link-button" role="button">Sign Up</Link>
                        </div>
                    </div>
                </form>
                <span className="error-message">{errorMessage}</span>
            </div>
        </div>
    )
}

export default SignIn
