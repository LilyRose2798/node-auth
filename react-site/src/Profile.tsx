import { useState, useEffect, useRef, useContext, FunctionComponent } from "react"
import { Link, useHistory } from "react-router-dom"
import { authContext } from "./App"
import { apiDELETE, apiGET } from "./util"
import { Info } from "./FormUtils"
import { UserPrivate } from "../../common/src/API"

export const Profile: FunctionComponent = () => {
    const [user, setUser] = useState<UserPrivate>()
    const [statusMessage, setStatusMessage] = useState("Loading profile data")
    const [errorMessage, setErrorMessage] = useState("")
    const authRef = useRef(useContext(authContext))
    const history = useHistory()
    
    useEffect(() => {
        apiGET("/profile", {}).then(res => {
            setStatusMessage("")
            if (res.data.success)
                setUser(res.data.data.user)
            else if (res.status === 401)
                authRef.current.setSignedIn(false)
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => {
            setStatusMessage("")
            setErrorMessage(err.message)
        })
    }, [setStatusMessage, setErrorMessage])

    const deleteProfile = () => {
        apiDELETE("/profile").then(res => {
            if (res.data.success) {
                setStatusMessage(res.data.message)
                setUser(undefined)
                const curPath = history.location.pathname
                setTimeout(() => {
                    authRef.current.setSignedIn(false)
                    if (history.location.pathname === curPath)
                        history.push("/")
                }, 5000)
            }
            else if (res.status === 401)
                authRef.current.setSignedIn(false)
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))
    }

    return (
        <div className="info-div">
            <div className="info-inner">
                <h1>Profile</h1>
                {user ? (<>
                    <div className="profile-div">
                        <div className="two-col-grid">
                            <Info label="ID" value={user.id} />
                            <Info label="Username" value={user.username} />
                            <Info label="Email" value={user.email} />
                            <Info label="First Name" value={user.firstName} />
                            <Info label="Last Name" value={user.lastName} />
                            <Info label="Password Hash" value={user.passwordHash} className="scrollable-text" />
                        </div>
                        {user.hashPreferences && (<details>
                            <summary>Hash Preferences</summary>
                            <div className="two-col-grid">
                                <label>Hash Algorithm: </label><span>{user.hashPreferences.algorithm}</span>
                                {(() => {
                                    switch(user.hashPreferences.algorithm) {
                                        case "Plain Hash":
                                            return <>
                                                <Info label="Digest Algorithm" value={user.hashPreferences.digestAlgorithm} />
                                            </>
                                        case "Plain Hash+Salt":
                                            return (<>
                                                <Info label="Digest Algorithm" value={user.hashPreferences.digestAlgorithm} />
                                                <Info label="Salt Length" value={user.hashPreferences.saltLength} />
                                            </>)
                                        case "HMAC":
                                            return (<>
                                                <Info label="Digest Algorithm" value={user.hashPreferences.digestAlgorithm} />
                                                <Info label="Salt Length" value={user.hashPreferences.saltLength} />
                                            </>)
                                        case "PBKDF2":
                                            return (<>
                                                <Info label="Digest Algorithm" value={user.hashPreferences.digestAlgorithm} />
                                                <Info label="Salt Length" value={user.hashPreferences.saltLength} />
                                                <Info label="Iterations" value={user.hashPreferences.iterations} />
                                                <Info label="Hash Length" value={user.hashPreferences.hashLength} />
                                            </>)
                                        case "BCrypt":
                                            return (<>
                                                <Info label="Minor Version" value={user.hashPreferences.minorVersion} />
                                                <Info label="Rounds" value={user.hashPreferences.rounds} />
                                            </>)
                                        case "SCrypt":
                                            return (<>
                                                <Info label="Hash Length" value={user.hashPreferences.hashLength} />
                                                <Info label="Salt Length" value={user.hashPreferences.saltLength} />
                                                <Info label="Cost" value={user.hashPreferences.cost} />
                                                <Info label="Block Size" value={user.hashPreferences.blockSize} />
                                                <Info label="Parallelization" value={user.hashPreferences.parallelization} />
                                            </>)
                                        case "Argon2":
                                            return (<>
                                                <Info label="Type" value={user.hashPreferences.type} />
                                                <Info label="Version" value={user.hashPreferences.version} />
                                                <Info label="Hash Length" value={user.hashPreferences.hashLength} />
                                                <Info label="Salt Length" value={user.hashPreferences.saltLength} />
                                                <Info label="Memory Cost" value={user.hashPreferences.memoryCost} />
                                                <Info label="Time Cost" value={user.hashPreferences.timeCost} />
                                                <Info label="Parallelism" value={user.hashPreferences.parallelism} />
                                            </>)
                                    }
                                })()}
                            </div>
                        </details>)}
                    </div>
                    <div className="button-div flex-row-reverse">
                        <div className="align-right flex-grow-1">
                            <button className="caution-button" onClick={e => window.confirm("Are you sure you want to delete your profile?") && deleteProfile()}>Delete Profile</button>
                        </div>
                        <div className="flex-grow-1">
                            <Link to="/profile/edit" className="link-button" role="button">Edit Profile</Link>
                        </div>
                    </div>
                </>) : <span>{statusMessage}</span>}
                <span className="error-message">{errorMessage}</span>
            </div>
        </div>
    )
}

export default Profile
