import { Path, RegisterOptions, UseFormRegister } from "react-hook-form"
import React, { FunctionComponent } from "react"

export type FormInfo<T> = { field: Path<T>, label: string, register: UseFormRegister<T>, registerOptions?: RegisterOptions }
export type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
export type FormInputInfo<T> = FormInfo<T> & InputProps
export type SelectProps = React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
export type FormSelectInfo<T> = FormInfo<T> & SelectProps

const inputPropsToRegisterOptions = (props: InputProps): RegisterOptions => ({
    required: props.required,
    min: props.min,
    max: props.max,
    minLength: props.minLength,
    maxLength: props.maxLength,
    valueAsNumber: props.type === "number"
})

export const FormInput = <T,>({ field, label, register, registerOptions, children, ...props }: FormInputInfo<T>) => (
    <div className="input-div">
        <label htmlFor={`${field}-input`}>{label}</label>
        <input id={`${field}-input`} aria-label={label} type={props.type ?? "text"} {...register(field, { ...inputPropsToRegisterOptions(props), ...registerOptions })} {...props} />
        <>{children}</>
    </div>
)

export const FormCheckbox = <T,>({ field, label, register, registerOptions, children, ...props }: FormInputInfo<T>) => (
    <div className="input-div">
        <input id={`${field}-input`} aria-label={label} type="checkbox" {...register(field, { ...inputPropsToRegisterOptions(props), ...registerOptions })} {...props} />
        <label className="inline-label" htmlFor={`${field}-input`}>{label}</label>
    </div>
)

export const FormSelect = <T,>({ field, label, register, registerOptions, children, ...props }: FormSelectInfo<T>) => (
    <div className="input-div">
        <label htmlFor={`${field}-input`}>{label}</label>
        <select id={`${field}-input`} aria-label={label} {...register(field, { required: props.required, ...registerOptions })} {...props}>
            <>{children}</>
        </select>
    </div>
)

export const Info: FunctionComponent<{ label: string, value?: any } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>> = ({ label, value, ...props }) => value ? (<>
    <label>{label}: </label><span {...props}>{value}</span>
</>) : (<></>)
