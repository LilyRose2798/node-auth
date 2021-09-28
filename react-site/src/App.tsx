import { useContext, createContext, useState, useEffect, FunctionComponent } from "react"
import { BrowserRouter as Router, Route, RouteProps, Link, Redirect, Switch } from "react-router-dom"
import Home from "./Home"
import Users from "./Users"
import Profile from "./Profile"
import EditProfile from "./EditProfile"
import SignIn from "./SignIn"
import SignUp from "./SignUp"
import SignOut from "./SignOut"
import "./App.css"

// const createCtx = <T,>(defaultValue: T) => {
//     type UpdateType = React.Dispatch<React.SetStateAction<typeof defaultValue>>
//     const defaultUpdate: UpdateType = () => defaultValue
//     const ctx = createContext({ state: defaultValue, update: defaultUpdate })
//     const Provider = (props: React.PropsWithChildren<{}>) => {
//         const [state, update] = useState(defaultValue)
//         return <ctx.Provider value={{ state, update }} {...props} />
//     }
//     return [ctx, Provider] as const
// }

// interface AuthState {
//     signedIn: boolean
// }

// export const [authContext, AuthProvider] = createCtx<AuthState>({ signedIn: localStorage.getItem("signedIn") === "true" })

const defaultValue = localStorage.getItem("signedIn") === "true"
type UpdateType = React.Dispatch<React.SetStateAction<typeof defaultValue>>
const setSignedIn: UpdateType = () => defaultValue
export const authContext = createContext({ signedIn: defaultValue, setSignedIn })
export const AuthProvider = (props: React.PropsWithChildren<{}>) => {
    const [signedIn, setSignedIn] = useState(defaultValue)
    useEffect(() => localStorage.setItem("signedIn", signedIn ? "true" : "false"), [signedIn])
    return <authContext.Provider value={{ signedIn, setSignedIn }} {...props} />
}

const PrivateRoute: FunctionComponent<RouteProps> = ({ children, ...rest }) => {
    const auth = useContext(authContext)
    return (<Route {...rest} render={({ location }) =>
        auth.signedIn ? (children) : (<Redirect to={{ pathname: "/signin", state: { from: location } }} />)}/>)
}

export const AppRouter: FunctionComponent = () => {
    const auth = useContext(authContext)
    return (
        <Router>
            <ul className="nav-bar">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/users">Users</Link></li>
                {auth.signedIn ? (<>
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link to="/signout">Sign out</Link></li>
                </>) : <>
                    <li><Link to="/signin">Sign in</Link></li>
                </>}
            </ul>
            <div className="content">
                <Switch>
                    <Route exact path="/"><Home /></Route>
                    <Route exact path="/users"><Users /></Route>
                    <PrivateRoute exact path="/profile"><Profile /></PrivateRoute>
                    <PrivateRoute exact path="/profile/edit"><EditProfile /></PrivateRoute>
                    <Route exact path="/signin"><SignIn /></Route>
                    <Route exact path="/signup"><SignUp /></Route>
                    <Route exact path="/signout"><SignOut /></Route>
                </Switch>
            </div>
        </Router>
    )
}

export const App: FunctionComponent = () => (
    <AuthProvider>
        <AppRouter />
    </AuthProvider>
)

export default App
