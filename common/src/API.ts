import User, { UserInfo } from "./User"

export type UserPrivate = User & { id?: string }
export type UserPublic = Omit<UserPrivate, "passwordHash" | "hashPreferences">
export type UsersPublic = UserPublic[]

export interface UserPublicData { user: UserPublic }
export interface UserPrivateData { user: UserPrivate }
export interface UsersPublicData { users: UsersPublic }
export interface UserAuthenticateData { userId: string }

export interface SearchQuery {
    page?: number
    limit?: number
    sort?: string
}

export type UsersQuery = Partial<Omit<User, "hashPreferences" | "passwordHash">>
export type UsersSearchQuery = UsersQuery & SearchQuery
export type UserCreateRequest = UserInfo & { password: string }
export type UserReplaceRequest = UserInfo & { password?: string }
export type UserUpdateRequest = Partial<UserCreateRequest>

export interface UserAuthenticateRequest {
    identifier: string
    password: string
}

export type QueryRoute = { query: object }
export type RequestRoute = { request: object }
export type ResponseRoute = { response: object }

export type QueryOrEmpty<T> = T extends QueryRoute ? T["query"] : {}
export type RequestOrEmpty<T> = T extends RequestRoute ? T["request"] : {}
export type ResponseOrEmpty<T> = T extends ResponseRoute ? T["response"] : {}

export interface APIMethodSpec {
    "GET": Partial<QueryRoute> & ResponseRoute
    "POST": RequestRoute & ResponseRoute
    "PUT": RequestRoute & ResponseRoute
    "PATCH": RequestRoute & ResponseRoute
    "DELETE": ResponseRoute
}

export type Route = { methods: { [T in keyof APIMethodSpec]?: APIMethodSpec[T] } }
export type ParamRoute = { param: ({ name: string } & Route) }

export type RoutePaths = "/users" | "/profile" | "/auth"

type APIRouteSpecSpec = { [T in RoutePaths]: Route & Partial<ParamRoute> }

export interface APIRouteSpec extends APIRouteSpecSpec {
    "/users": {
        methods: {
            "GET": {
                query: UsersSearchQuery
                response: UsersPublicData
            }
            "POST": {
                request: UserCreateRequest
                response: UserPrivateData
            }
        }
        param: {
            name: "userId"
            methods: {
                "GET": {
                    response: UserPublicData
                }
                "PUT": {
                    request: UserReplaceRequest
                    response: UserPrivateData
                }
                "PATCH": {
                    request: UserUpdateRequest
                    response: UserPrivateData
                }
                "DELETE": {
                    response: UserPrivateData
                }
            }
        }
    }
    "/profile": {
        methods: {
            "GET": {
                response: UserPrivateData
            }
            "PUT": {
                request: UserReplaceRequest
                response: UserPrivateData
            }
            "PATCH": {
                request: UserUpdateRequest
                response: UserPrivateData
            }
            "DELETE": {
                response: UserPrivateData
            }
        }
    }
    "/auth": {
        methods: {
            "GET": {
                response: UserAuthenticateData
            }
            "POST": {
                request: UserAuthenticateRequest
                response: UserAuthenticateData
            }
            "DELETE": {
                response: UserAuthenticateData
            }
        }
    }
}

interface APIResponseSpec<T> {
    success: boolean,
    message: string,
    data: T
}

export interface SuccessResponse<T = {}> extends APIResponseSpec<T> { success: true }
export interface ErrorResponse extends APIResponseSpec<{}> { success: false }
export type APIResponse<T = {}> = SuccessResponse<T> | ErrorResponse
