declare module "@phc/format" {
    export interface PHCOpts {
        id: string
        version?: number
        params?: Object
        salt?: Buffer
        hash?: Buffer
    }
    export function serialize(opts: PHCOpts): string
    export function deserialize(phcstr: string): PHCOpts
}
