'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
    const pathname = usePathname()

    const links = [
        { href: '/input', label: '入力 (Input)' },
        { href: '/summary', label: '集計 (Summary)' },
        { href: '/records', label: '記録 (Records)' },
    ]

    return (
        <nav className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">Setting Tool</div>
                <div className="flex space-x-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-2 rounded transition-colors ${pathname.startsWith(link.href)
                                    ? 'bg-gray-700 font-semibold'
                                    : 'hover:bg-gray-700'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
