import { Children, cloneElement, forwardRef, isValidElement, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputStyles = (invalid?: boolean, className?: string) =>
  cn(
    "w-full rounded-2xl border bg-white px-4 py-3 font-sans text-[16px] text-ink placeholder:text-ink-soft/60 sm:text-[15px]",
    "transition-[border-color,box-shadow] duration-200 ease-lux",
    "focus:outline-none focus:ring-4",
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-maleja-pastel/60 hover:border-maleja-pastel focus:border-maleja focus:ring-maleja/10",
    "disabled:cursor-not-allowed disabled:bg-maleja-canvas/60",
    className
  );

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  // Vincula error/ayuda al control (aria-describedby / aria-invalid / aria-required)
  // cuando el hijo directo es el propio campo.
  const content =
    htmlFor && Children.count(children) === 1 && isValidElement<Record<string, unknown>>(children) && children.props.id === htmlFor
      ? cloneElement(children, {
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
          "aria-required": required || undefined,
        })
      : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-maleja-deep">
              *
            </span>
          )}
        </label>
      )}
      {content}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={inputStyles(invalid, className)} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={inputStyles(invalid, cn("min-h-[96px] resize-y", className))}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={inputStyles(
          invalid,
          cn(
            "appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10",
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B7480' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
            className
          )
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn("flex min-h-[44px] cursor-pointer items-center justify-between gap-4", disabled && "opacity-60")}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="block text-xs text-ink-soft">{description}</span>}
        </span>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-lux",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maleja/40 focus-visible:ring-offset-2",
          checked ? "bg-maleja" : "bg-ink/15"
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ease-lux",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  );
}
