"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
    containerRef: React.RefObject<HTMLDivElement | null>
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
        <DropdownMenuContext.Provider value={{ open, setOpen, containerRef }}>
            <div className="relative inline-block" ref={containerRef} data-dropdown-container>
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
    sideOffset
}: {
    children: React.ReactNode
    align?: "start" | "end"
    className?: string
    sideOffset?: number
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

    const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!context.open) return

        const updatePosition = () => {
            const container = context.containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const top = rect.bottom + (sideOffset || 4)
            const left = align === "end" ? rect.right - 288 : rect.left // 288px is w-72 width

            setPosition({ top, left })
        }

        updatePosition()
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition)
        }
    }, [context.open, align, sideOffset])

    if (!context.open || !position) return null

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
                onClick={() => context.setOpen(false)}
            />
            {/* Content */}
            <div
                ref={contentRef}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                    "fixed z-[10000] overflow-hidden rounded-[20px] border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/50 outline-none dark:border-slate-800 dark:bg-slate-950 dark:shadow-none animate-in fade-in zoom-in-95 duration-150",
                    className
                )}
                style={{
                    top: position.top,
                    left: position.left,
                    width: '288px' // w-72
                }}
            >
                {children}
            </div>
        </>,
        document.body
    )
}

export function DropdownMenuLabel({
    children,
    className
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
            {children}
        </div>
    )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
    return <div className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)} />
}

export function DropdownMenuItem({
    children,
    onClick,
    className,
    closeOnSelect,
    asChild
}: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    closeOnSelect?: boolean
    asChild?: boolean
}) {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu")

    const handleClick = (e: React.MouseEvent) => {
        // Only prevent default if it's NOT a child link or similar
        // Actually, we want to allow navigation but still close the menu
        onClick?.()
        if (closeOnSelect !== false) {
            context.setOpen(false)
        }
    }

    const commonProps = {
        onClick: handleClick,
        className: cn(
            "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-900 dark:focus:bg-slate-900",
            className
        )
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, commonProps)
    }

    return (
        <div {...commonProps}>
            {children}
        </div>
    )
}
