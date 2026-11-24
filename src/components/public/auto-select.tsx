'use client'

/** <select> que envía el formulario al cambiar. Puede vaciar otros campos dependientes (ej.: al cambiar provincia, limpia ciudad). */
export function AutoSubmitSelect({ clears = [], children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { clears?: string[] }) {
  return (
    <select
      {...props}
      onChange={(e) => {
        const form = e.currentTarget.form
        if (!form) return
        for (const name of clears) {
          const el = form.elements.namedItem(name)
          if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) el.value = ''
        }
        form.requestSubmit()
      }}
    >
      {children}
    </select>
  )
}
