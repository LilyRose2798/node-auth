import dotenv from "dotenv"
import { Router, Response, RequestHandler } from "express"
import { UserModel } from "./UserModel"
import { APIResponse, SuccessResponse, ErrorResponse, UserPublicData, UserPrivateData, UsersPublicData, UserAuthenticateData, APIRouteSpec, QueryOrEmpty, RequestRoute, ResponseOrEmpty, ParamRoute, APIMethodSpec, Route } from "../../common/build/API"
import { PAGE_SIZE } from "../../common/build/constants"
import { User } from "../../common/build/User"
import { processErrors, usersQueryValidator, userCreateValidator, userReplaceValidator, userUpdateValidator, userAuthenticateValidator } from "./validators"

declare module "express-session" {
    interface SessionData {
        userId: string
    }
}

dotenv.config()

const MONGO_DUP_KEY_ERROR_REGEX = /^E11000 duplicate key error collection: (.+?) index: (.+?) dup key: { : "(.*?)" }$/

const createSuccessResponse = <T extends object>(message: string = "Request completed successfully", data: T): SuccessResponse<T> =>
    ({ success: true, message, data })
const createErrorResponse = (message: string = "Error performing request"): ErrorResponse =>
    ({ success: false, message, data: {} })

type AnyIfRequestOrEmpty<T> = T extends RequestRoute ? any : {}

type MethodHandlers<T extends Route, P extends object = {}> = {
    methodHandlers: {
        [U in keyof T["methods"]]: RequestHandler<P, APIResponse<ResponseOrEmpty<T["methods"][U]>>, AnyIfRequestOrEmpty<T["methods"][U]>, QueryOrEmpty<T["methods"][U]>>
    }
}

type APIRouteHandlerSpec = {
    [T in keyof APIRouteSpec]: (MethodHandlers<APIRouteSpec[T]> & (APIRouteSpec[T] extends ParamRoute ? {
        param: ({ name: APIRouteSpec[T]["param"]["name"] } & MethodHandlers<APIRouteSpec[T]["param"], { [U in APIRouteSpec[T]["param"]["name"]]: string }>)
    } : {}))
}

const putUserById = async (res: Response<APIResponse<UserPrivateData>>, userId: string, body: any) => {
    const userDoc = await UserModel.findById(userId)
    if (!userDoc) return res.status(404).send(createErrorResponse("User not found"))
    if (!userReplaceValidator(body)) return res.status(400).send(createErrorResponse(processErrors(userReplaceValidator.errors)))
    const { password, ...userInfo } = body
    const passwordHash = password === undefined ? userDoc.passwordHash : await UserModel.hashPassword(password, userInfo.hashPreferences)
    const updatedUser = await UserModel.findByIdAndUpdate({ _id: userId }, { passwordHash, ...userInfo }, { overwrite: true, new: true })
    if (!updatedUser) return res.status(404).send(createErrorResponse("User not found"))
    return res.send(createSuccessResponse<UserPrivateData>("User updated successfully", { user: updatedUser.toPrivate() }))
}

const patchUserById = async (res: Response<APIResponse<UserPrivateData>>, userId: string, body: any) => {
    const userDoc = await UserModel.findById(userId)
    if (!userDoc) return res.status(404).send(createErrorResponse("User not found"))
    if (!userUpdateValidator(body)) return res.status(400).send(createErrorResponse(processErrors(userUpdateValidator.errors)))
    const { password, ...userInfo } = body
    const passwordHash = password === undefined ? undefined : await UserModel.hashPassword(password, userInfo.hashPreferences)
    const updatedUser = await UserModel.findByIdAndUpdate(userId, { $set: { ...(passwordHash === undefined ? {} : { passwordHash }), ...userInfo } }, { new: true })
    if (!updatedUser) return res.status(404).send(createErrorResponse("User not found"))
    return res.send(createSuccessResponse<UserPrivateData>("User updated successfully", { user: updatedUser.toPrivate() }))
}

const deleteUserById = async (res: Response<APIResponse<UserPrivateData>>, userId: string) => {
    const userDoc = await UserModel.findByIdAndDelete(userId)
    if (!userDoc) return res.status(404).send(createErrorResponse("User not found with provided ID"))
    return res.send(createSuccessResponse<UserPrivateData>("User deleted successfully", { user: userDoc.toPrivate() }))
}

const apiRouteHandlers: APIRouteHandlerSpec = {
    "/users": {
        methodHandlers: {
            "GET": async ({ query }, res) => {
                if (!usersQueryValidator(query)) return res.status(400).send(createErrorResponse(processErrors(usersQueryValidator.errors)))
                const { page = 1, limit = PAGE_SIZE, sort, ...usersQuery } = query
                const sorts: [string, number][] = sort?.split(",").map(x =>
                    x.startsWith("+") || x.startsWith(" ") ? [x.slice(1), 1] : x.startsWith("-") ? [x.slice(1), -1] : [x, 1]) ?? []
                const sortObj = Object.fromEntries(sorts)
                const skip = limit * (page - 1)
                const userDocs = await UserModel.find(usersQuery).sort(sortObj).skip(skip).limit(limit)
                return res.send(createSuccessResponse<UsersPublicData>(userDocs.length === 0 ? "No user data found" : "User data found", { users: userDocs.map(userDoc => userDoc.toPublic()) }))
            },
            "POST": async ({ body }, res) => {
                if (!userCreateValidator(body)) return res.status(400).send(createErrorResponse(processErrors(userCreateValidator.errors)))
                const { password, ...userInfo } = body
                const passwordHash = await UserModel.hashPassword(password, userInfo.hashPreferences)
                const user: User = { passwordHash, ...userInfo }
                const userDoc = new UserModel(user)
                try {
                    const createdUserDoc = await userDoc.save()
                    return res.send(createSuccessResponse<UserPrivateData>("User created successfully", { user: createdUserDoc.toPrivate() }))
                }
                catch (err) {
                    return res.status(400).send(createErrorResponse(err.code === 11000
                        ? `User already exists with that ${
                            err.message.match(MONGO_DUP_KEY_ERROR_REGEX)[2].split("_")[0]}`
                        : err.message))
                }
            }
        },
        param: {
            name: "userId",
            methodHandlers: {
                "GET": async ({ params: { userId } }, res) => {
                    const userDoc = await UserModel.findById(userId)
                    if (!userDoc) return res.status(404).send(createErrorResponse("User not found"))
                    return res.send(createSuccessResponse<UserPublicData>("User data found", { user: userDoc.toPublic() }))
                },
                "PUT": async ({ params: { userId }, body, session }, res) => {
                    if (session.userId !== userId) return res.status(401).send(createErrorResponse("Not authenticated"))
                    return await putUserById(res, userId, body)
                },
                "PATCH": async ({ params: { userId }, body, session }, res) => {
                    if (session.userId !== userId) return res.status(401).send(createErrorResponse("Not authenticated"))
                    return await patchUserById(res, userId, body)
                },
                "DELETE": async ({ params: { userId }, session }, res) => {
                    if (session.userId !== userId) return res.status(401).send(createErrorResponse("Not authenticated"))
                    return await deleteUserById(res, userId)
                }
            }
        }
    },
    "/profile": {
        methodHandlers: {
            "GET": async ({ session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                const userDoc = await UserModel.findById(session.userId)
                if (!userDoc) return res.status(404).send(createErrorResponse("User not found"))
                return res.send(createSuccessResponse<UserPrivateData>("User data found", { user: userDoc.toPrivate() }))
            },
            "PUT": async ({ body, session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                return await putUserById(res, session.userId, body)
            },
            "PATCH": async ({ body, session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                return await patchUserById(res, session.userId, body)
            },
            "DELETE": async ({ session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                return await deleteUserById(res, session.userId)
            }
        }
    },
    "/auth": {
        methodHandlers: {
            "GET": async ({ session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                return res.send(createSuccessResponse<UserAuthenticateData>("Currently authenticated", { userId: session.userId }))
            },
            "POST": async ({ body, session }, res) => {
                if (!userAuthenticateValidator(body)) return res.status(400).send(createErrorResponse(processErrors(userAuthenticateValidator.errors)))
                const { identifier, password } = body
                const user = await UserModel.findOne({ username: identifier }) ?? await UserModel.findOne({ email: identifier })
                if (!user) return res.status(404).send(createErrorResponse("User not found"))
                const verified = await user.verifyPassword(password)
                if (!verified) return res.status(400).send(createErrorResponse("Failed to authenticate user"))
                const userId = user._id
                if (!userId) return res.status(404).send(createErrorResponse("User ID not found"))
                session.userId = userId
                return res.send(createSuccessResponse<UserAuthenticateData>("Authenticated successfully", { userId: userId }))
            },
            "DELETE": async ({ session }, res) => {
                if (session.userId === undefined) return res.status(401).send(createErrorResponse("Not authenticated"))
                const userId = session.userId
                session.userId = undefined
                return res.send(createSuccessResponse<UserAuthenticateData>("Unauthenticated successfully", { userId: userId }))
            }
        }
    }
} as const

const router = Router()

type RouterMethods = { [T in keyof APIMethodSpec]: (path: string, ...handlers: RequestHandler<any, any, any, any>[]) => Router }
const routerMethods: RouterMethods = {
    "GET": router.get.bind(router),
    "POST": router.post.bind(router),
    "PUT": router.put.bind(router),
    "PATCH": router.patch.bind(router),
    "DELETE": router.delete.bind(router)
} as const

const entriesUnsafe = <T extends object>(obj: T) => Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][]

entriesUnsafe(apiRouteHandlers).forEach(([path, route]) => {
    entriesUnsafe(route.methodHandlers).forEach(([method, handler]) =>
        routerMethods[method](path, handler))
    if ("param" in route)
        entriesUnsafe(route.param.methodHandlers).forEach(([method, handler]) =>
            routerMethods[method](`${path}/:${route.param.name}`, handler))
})

export default router
