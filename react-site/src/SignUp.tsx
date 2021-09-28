import { useState, FunctionComponent } from "react"
import { useHistory } from "react-router-dom"
import { SubmitHandler } from "react-hook-form"
import { apiPOST } from "./util"
import { UserCreateRequest, UserPrivate } from "../../common/src/API"
import { UserCreateForm } from "./UserForm"

export const SignUp: FunctionComponent = () => {
    const [user, setUser] = useState<UserPrivate>()
    const [statusMessage, setStatusMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const history = useHistory()

    const onSubmit: SubmitHandler<UserCreateRequest> = async data =>
        apiPOST("/users", data).then(res => {
            if (res.data.success) {
                setStatusMessage(res.data.message)
                setUser(res.data.data.user)
                setTimeout(() => history.push("/signin"), 5000)
            } else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))

    return (
        <div className="info-div">
            <h1>Sign Up</h1>
            <div className="info-inner">
                <UserCreateForm submitText="Sign Up" onSubmit={onSubmit} />
                {user ? (
                    <div className="user-div">
                        <p>{statusMessage}</p>
                        <p><label>ID: </label><span>{user.id}</span></p>
                        <p><label>Username: </label><span>{user.username}</span></p>
                        <p><label>Email: </label><span>{user.email}</span></p>
                        <p><label>First name: </label><span>{user.firstName}</span></p>
                        <p><label>Last name: </label><span>{user.lastName}</span></p>
                    </div>
                ) : (<p>{statusMessage}</p>)}
                <span className="error-message">{errorMessage}</span>
            </div>
        </div>
    )
}

export default SignUp
