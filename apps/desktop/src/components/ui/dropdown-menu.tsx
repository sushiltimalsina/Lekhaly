// apps/desktop/src/components/ui/dropdown-menu.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open])

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block" ref={containerRef}>
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

export function DropdownMenuTrigger({
    children,
    asChild
}: {
    children: React.ReactNode
    asChild?: boolean
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        context.setOpen(!context.open)
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: handleClick,
        })
    }

    return (
        <div onClick={handleClick} className="cursor-pointer">
            {children}
        </div>
    )
}

export function DropdownMenuContent({
    children,
    align = "end",
    className,
    sideOffset,
    closeOnSelect
}: {
    children: React.ReactNode
    align?: "start" | "end"
    className?: string
    sideOffset?: number
    closeOnSelect?: boolean
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

    if (!context.open) return null

    return (
        <div
            className={cn(
                "absolute z-50 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/50 outline-none dark:border-slate-800 dark:bg-slate-950 dark:shadow-none animate-in fade-in zoom-in-95 duration-150",
                align === "end" ? "right-0" : "left-0",
                className
            )}
            style={{ marginTop: sideOffset ? `${sideOffset}px` : '0.5rem' }}
        >
            {children}
        </div>
    )
}

export function DropdownMenuItem({
    children,
    onClick,
    className,
    closeOnSelect
}: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    closeOnSelect?: boolean
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
        if (closeOnSelect !== false) {
            context.setOpen(false)
        }
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-900 dark:focus:bg-slate-900",
                className
            )}
        >
            {children}
        </div>
    )
}
