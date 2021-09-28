import { useState, FunctionComponent } from "react"
import { SubmitHandler } from "react-hook-form"
import SearchQueryForm, { SearchQueryFormInputInfo } from "./SearchQueryForm"
import { apiGET } from "./util"
import { Info } from "./FormUtils"
import { UsersPublic, UsersQuery, UsersSearchQuery } from "../../common/src/API"

export const Users: FunctionComponent = () => {
    const [users, setUsers] = useState<UsersPublic>()
    const [statusMessage, setStatusMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const formInputs: SearchQueryFormInputInfo<UsersQuery>[] = [
        { field: "username", label: "Username", autoComplete: "username" },
        { field: "email", label: "Email", autoComplete: "email" },
        { field: "firstName", label: "First Name", autoComplete: "given-name" },
        { field: "lastName", label: "Last Name", autoComplete: "family-name" }
    ]

    const onSubmit: SubmitHandler<UsersSearchQuery> = async data => {
        setStatusMessage("Searching Users...")
        setUsers(undefined)
        apiGET("/users", data).then(res => {
            if (res.data.success) {
                if (res.data.data.users.length === 0)
                    setStatusMessage("No users match search criteria")
                else
                    setUsers(res.data.data.users)
            }
            else
                setErrorMessage(res.data.message)
        }).catch((err: Error) => setErrorMessage(err.message))
    }

    return (
        <div className="info-div">
            <div className="info-inner">
                <h1>User Query</h1>
                <SearchQueryForm formClass="users-div" formInputs={formInputs} onSubmit={onSubmit} />
                <div className="users-div">
                    {users ? users.map(user => (
                        <div className="two-col-grid">
                            <Info label="ID" value={user.id} />
                            <Info label="Username" value={user.username} />
                            <Info label="Email" value={user.email} />
                            <Info label="First Name" value={user.firstName} />
                            <Info label="Last Name" value={user.lastName} />
                        </div>
                    )) : statusMessage}
                </div>
                <span className="error-message">{errorMessage}</span>
            </div>
        </div>
    )
}

export default Users
