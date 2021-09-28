import axios, { AxiosRequestConfig } from "axios"
import { APIResponse, APIRouteSpec, QueryOrEmpty, RequestOrEmpty, ResponseOrEmpty, ParamRoute, APIMethodSpec } from "../../common/src/API"

export const API_PORT = Number(process.env.REACT_APP_API_PORT) || 5000
export const API_URL = `http://localhost:${API_PORT}`
export const AXIOS_CONFIG: AxiosRequestConfig = {
    withCredentials: true,
    validateStatus: status => status >= 200 && status < 500
}

type PropOrNever<T, U> = U extends keyof T ? T[U] : never
type ParamOrNever<T> = T extends ParamRoute ? T["param"] : never
type RouteMethod<T extends keyof APIRouteSpec, U extends keyof APIMethodSpec> = PropOrNever<APIRouteSpec[T]["methods"], U>
type ParamRouteMethod<T extends keyof APIRouteSpec, U extends keyof APIMethodSpec> = PropOrNever<ParamOrNever<APIRouteSpec[T]>["methods"], U>
type APIRouteResponse<T> = APIResponse<ResponseOrEmpty<T>>

export const apiGET = <T extends keyof APIRouteSpec, U extends RouteMethod<T, "GET">>(apiPath: T, query: QueryOrEmpty<U>) =>
    axios.get<APIResponse<ResponseOrEmpty<U>>>(new URL(apiPath, API_URL).toString(), { params: query, ...AXIOS_CONFIG }).catch(_ => {
        throw new Error("Unable to connect to API")
    })
export const apiGETParam = <T extends keyof APIRouteSpec, U extends ParamRouteMethod<T, "GET">>(apiPath: T, param: string, query?: QueryOrEmpty<U>) =>
    axios.get<APIRouteResponse<U>>(new URL(`${apiPath}/${param}`, API_URL).toString(), { params: query, ...AXIOS_CONFIG }).catch(_ => {
        throw new Error("Unable to connect to API")
    })

export const apiPOST = <T extends keyof APIRouteSpec, U extends RouteMethod<T, "POST">>(apiPath: T, data: RequestOrEmpty<U>) =>
    axios.post<APIRouteResponse<U>>(new URL(apiPath, API_URL).toString(), data, AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })

export const apiPUT = <T extends keyof APIRouteSpec, U extends RouteMethod<T, "PUT">>(apiPath: T, data: RequestOrEmpty<U>) =>
    axios.put<APIRouteResponse<U>>(new URL(apiPath, API_URL).toString(), data, AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })
export const apiPUTParam = <T extends keyof APIRouteSpec, U extends ParamRouteMethod<T, "PUT">>(apiPath: T, param: string, data: RequestOrEmpty<U>) =>
    axios.put<APIRouteResponse<U>>(new URL(`${apiPath}/${param}`, API_URL).toString(), data, AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })

export const apiPATCH = <T extends keyof APIRouteSpec, U extends RouteMethod<T, "PATCH">>(apiPath: T, data: RequestOrEmpty<U>) =>
    axios.patch<APIRouteResponse<U>>(new URL(apiPath, API_URL).toString(), data, AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })
export const apiPATCHParam = <T extends keyof APIRouteSpec, U extends ParamRouteMethod<T, "PATCH">>(apiPath: T, param: string, data: RequestOrEmpty<U>) =>
    axios.patch<APIRouteResponse<U>>(new URL(`${apiPath}/${param}`, API_URL).toString(), data, AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })

export const apiDELETE = <T extends keyof APIRouteSpec, U extends RouteMethod<T, "DELETE">>(apiPath: T) =>
    axios.delete<APIRouteResponse<U>>(new URL(apiPath, API_URL).toString(), AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })
export const apiDELETEParam = <T extends keyof APIRouteSpec, U extends ParamRouteMethod<T, "DELETE">>(apiPath: T, param: string) =>
    axios.get<APIRouteResponse<U>>(new URL(`${apiPath}/${param}`, API_URL).toString(), AXIOS_CONFIG).catch(_ => {
        throw new Error("Unable to connect to API")
    })

export const removeEmptyFields = (data: { [key: string]: any }): { [key: string]: any } => {
    Object.keys(data).forEach(key => {
        const val = data[key]
        if (typeof val === "object") {
            removeEmptyFields(val)
            if (Object.keys(val).length === 0)
                delete data[key]
        }
        if ((typeof val === "string" && val.length === 0) || (typeof val === "number" && isNaN(val)))
            delete data[key]
    })
    return data
}
