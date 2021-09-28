import { useState, useContext, useEffect, useRef, FunctionComponent } from "react"
import { useHistory } from "react-router-dom"
import { authContext } from "./App"
import { UserReplaceForm } from "./UserForm"
import { apiGET, apiPUT } from "./util"
import { UserPrivate, UserReplaceRequest } from "../../common/src/API"
import { SubmitHandler } from "react-hook-form"

export const EditProfile: FunctionComponent = () => {
    const [user, setUser] = useState<UserPrivate>()
    const [statusMessage, setStatusMessage] = useState("Loading profile data")
    const [errorMessage, setErrorMessage] = useState("")
    const auth = useContext(authContext)
    const authRef = useRef(auth)
    const history = useHistory()

    useEffect(() => {
        apiGET("/profile", {}).then(res => {
            if (res.data.success)
                setUser(res.data.data.user)
            else if (res.status === 401)
                authRef.current.setSignedIn(false)
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))
    }, [setStatusMessage, setErrorMessage, setUser])

    const onSubmit: SubmitHandler<UserReplaceRequest> = async data =>
        apiPUT("/profile", data).then(res => {
            if (res.data.success)
                history.push("/profile")
            else if (res.status === 401)
                auth.setSignedIn(false)
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))

    return (
        <div className="info-div">
            <div className="info-inner">
                <h1>Edit Profile</h1>
                {user ? <UserReplaceForm submitText="Save Profile" user={user} onSubmit={onSubmit} /> : <p>{statusMessage}</p>}
                <span className="error-message">{errorMessage}</span>
            </div>
        </div>
    )
}

export default EditProfile
