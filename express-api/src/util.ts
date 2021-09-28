export const pick = <T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> =>
    keys.reduce((acc, key) => {
        if (key in obj)
            acc[key] = obj[key]
        return acc
    }, {} as any)
