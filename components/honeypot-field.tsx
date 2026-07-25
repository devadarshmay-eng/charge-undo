type HoneypotFieldProps = { name?: string };

/** Include in client write forms; callers must skip writeJson when this field has a value. */
export function HoneypotField({ name = "website_confirmation" }: HoneypotFieldProps) {
  return (
    <div aria-hidden="true" className="hidden">
      <label htmlFor={name}>Leave this field empty</label>
      <input id={name} name={name} tabIndex={-1} autoComplete="off" />
    </div>
  );
}
