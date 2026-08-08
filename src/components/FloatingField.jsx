import { useThemedBorder } from '../context/ThemeContext';

const inputClass =
  'w-full bg-transparent outline-none text-base text-base-content placeholder:text-base-content/40';

function useFieldBorder(error) {
  const borders = useThemedBorder();
  return error ? borders.fieldError : borders.field;
}

export function FloatingInput({
  label,
  required = false,
  error,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  const fieldBorder = useFieldBorder(error);

  return (
    <fieldset
      className={`group relative rounded-xl border bg-base-100 px-4 pt-1 pb-3 transition-colors duration-200 ${fieldBorder} ${className}`}
    >
      <legend className="px-1 text-sm font-medium text-base-content/80">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </legend>
      <input className={`${inputClass} ${inputClassName}`} {...inputProps} />
      {error && <p className="text-error text-xs mt-1.5">{error}</p>}
    </fieldset>
  );
}

export function FloatingTextarea({
  label,
  required = false,
  error,
  className = '',
  inputClassName = '',
  rows = 6,
  ...textareaProps
}) {
  const fieldBorder = useFieldBorder(error);

  return (
    <fieldset
      className={`group relative rounded-xl border bg-base-100 px-4 pt-1 pb-3 transition-colors duration-200 ${fieldBorder} ${className}`}
    >
      <legend className="px-1 text-sm font-medium text-base-content/80">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </legend>
      <textarea
        rows={rows}
        className={`${inputClass} resize-y min-h-[9rem] leading-relaxed ${inputClassName}`}
        {...textareaProps}
      />
      {error && <p className="text-error text-xs mt-1.5">{error}</p>}
    </fieldset>
  );
}

export function FloatingSelect({
  label,
  required = false,
  error,
  className = '',
  children,
  ...selectProps
}) {
  const fieldBorder = useFieldBorder(error);

  return (
    <fieldset
      className={`group relative rounded-xl border bg-base-100 px-4 pt-1 pb-3 transition-colors duration-200 ${fieldBorder} ${className}`}
    >
      <legend className="px-1 text-sm font-medium text-base-content/80">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </legend>
      <select className={`${inputClass} cursor-pointer`} {...selectProps}>
        {children}
      </select>
      {error && <p className="text-error text-xs mt-1.5">{error}</p>}
    </fieldset>
  );
}
