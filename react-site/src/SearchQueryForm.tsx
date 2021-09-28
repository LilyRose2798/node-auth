import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form"
import { FormInputInfo, FormInput, FormSelect } from "./FormUtils"
import { removeEmptyFields } from "./util"
import { SearchQuery } from "../../common/src/API"
import { PAGE_SIZE } from "../../common/src/constants"

export type SearchQueryFormInputInfo<T> = Omit<FormInputInfo<T>, "register">

export const SearchQueryForm = <T,>({ formClass, formInputs, onSubmit, onSubmitError }: { formClass: string, formInputs: SearchQueryFormInputInfo<T>[], onSubmit: SubmitHandler<T>, onSubmitError?: SubmitErrorHandler<SearchQuery | T> }) => {
    const { register, handleSubmit } = useForm<SearchQuery | T>({ defaultValues: { page: 1, limit: PAGE_SIZE } })
    const onSubmitHandler = handleSubmit<SearchQuery & T>(data => {
        removeEmptyFields(data)
        console.log(data)
        return onSubmit(data)
    }, onSubmitError)

    return (
        <form className={formClass} onSubmit={onSubmitHandler}>
            {formInputs.map(formInput => FormInput({ register, ...formInput }))}
            <details>
                <summary>Query Options</summary>
                <FormInput field="page" label="Page Number" type="number" min={1} register={register} />
                <FormInput field="limit" label="Result Limit" type="number" min={1} max={PAGE_SIZE} register={register} />
                <FormSelect field="sort" label="Sorting" register={register}>
                    <option value="">None</option>
                    {formInputs.map(({ field, label }) => (<>
                        <option value={`+${field}`}>{label} (Ascending)</option>
                        <option value={`-${field}`}>{label} (Descending)</option>
                    </>))}
                </FormSelect>
            </details>
            <div className="button-div">
                <button type="submit">Search</button>
            </div>
        </form>
    )
}

export default SearchQueryForm
