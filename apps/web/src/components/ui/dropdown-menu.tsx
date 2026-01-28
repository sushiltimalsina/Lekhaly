"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    className
}: {
    children: React.ReactNode
    align?: "start" | "end"
    className?: string
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

    return (
        <AnimatePresence>
            {context.open && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={cn(
                        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-[20px] border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/50 outline-none dark:border-slate-800 dark:bg-slate-950 dark:shadow-none",
                        align === "end" ? "right-0" : "left-0",
                        className
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export function DropdownMenuItem({
    children,
    onClick,
    className
}: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
        context.setOpen(false)
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
