export function FormField({ label, htmlFor, help, error, children, required }: { label: string; htmlFor?: string; help?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}
