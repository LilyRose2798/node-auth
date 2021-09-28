import { useState, useContext, useRef, useEffect, FunctionComponent } from "react"
import { useHistory } from "react-router-dom"
import { authContext } from "./App"
import { apiDELETE } from "./util"

export const SignOut: FunctionComponent = () => {
    const [statusMessage, setStatusMessage] = useState("Signing out")
    const authRef = useRef(useContext(authContext))
    const history = useHistory()

    useEffect(() => {
        apiDELETE("/auth").then(res => {
            const redirect = (message: string) => {
                authRef.current.setSignedIn(false)
                setStatusMessage(message)
                const curPath = history.location.pathname
                setTimeout(() => {
                    if (history.location.pathname === curPath)
                        history.push("/")
                }, 5000)
            }

            if (res.data.success)
                redirect("You have been signed out, returning to home page")
            else if (res.status === 401)
                redirect("Already signed out, returning to home page")
            else
                setStatusMessage(res.data.message)
        }).catch((err: Error) => setStatusMessage(err.message))
    }, [setStatusMessage, history])

    return (
        <div className="center-div">
            <p>{statusMessage}</p>
        </div>
    )
}

export default SignOut
