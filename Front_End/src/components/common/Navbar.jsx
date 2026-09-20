import React, { useState } from 'react';
import { Search, Bookmark, User } from 'lucide-react';
import Input from './Input';

function Navbar() {
    const [activeTab, setActiveTab] = useState('Home');
    const [searchQuery, setSearchQuery] = useState('');

    const navItems = [
        { name: 'Home', href: '#' },
        { name: 'Content', href: '#' },
        { name: 'Community', href: '#' },
        { name: 'AI Assistant', href: '#' },
        { name: 'BMI Analysis', href: '#' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-[#f7faf7]/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">

            {/* Navbar container */}
            <div className="w-full max-w-[1200px] mx-auto h-20 px-6 flex items-center">

                {/* ================= LOGO ================= */}
                <a
                    href="#"
                    className="flex items-center gap-3 shrink-0"
                >
                    {/* Logo */}
                    <div className="w-9 h-9 rounded-full bg-[#006b2c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        C
                    </div>

                    {/* Logo name */}
                    <span className="text-xl font-bold tracking-tight text-[#006b2c]">
                        ChayBook
                    </span>
                </a>


                {/* ================= NAVIGATION ================= */}
                <nav className="hidden lg:flex items-center gap-7 ml-12">

                    {navItems.map((item) => {
                        const isActive = activeTab === item.name;

                        return (
                            <a
                                key={item.name}
                                href={item.href}
                                onClick={() => setActiveTab(item.name)}
                                className={`
                                    text-sm
                                    font-semibold
                                    transition-colors
                                    py-7
                                    relative
                                    ${
                                        isActive
                                            ? 'text-[#006b2c]'
                                            : 'text-gray-600 hover:text-[#006b2c]'
                                    }
                                `}
                            >
                                {item.name}

                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#006b2c] rounded-full" />
                                )}
                            </a>
                        );
                    })}

                </nav>


                {/* ================= RIGHT SIDE ================= */}
                <div className="ml-auto flex items-center gap-3">

                    {/* Search */}
                    <div className="hidden sm:block w-48 xl:w-64">

                        <Input
                            icon={Search}
                            placeholder="Search plant-based recipes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#f1f4f1] border-transparent focus:bg-white"
                        />

                    </div>


                    {/* Bookmark */}
                    <button
                        type="button"
                        aria-label="Saved Bookmarks"
                        className="
                            w-10 h-10
                            flex items-center justify-center
                            rounded-xl
                            text-gray-600
                            hover:bg-[#f1f4f1]
                            hover:text-[#006b2c]
                            transition-colors
                        "
                    >
                        <Bookmark className="w-5 h-5" />
                    </button>


                    {/* Login / Sign Up */}
                    <a
                        href="#"
                        className="
                            inline-flex
                            items-center
                            justify-center
                            h-10
                            px-4
                            rounded-xl
                            bg-[#006b2c]
                            text-white
                            font-semibold
                            text-sm
                            hover:bg-[#00873a]
                            transition-colors
                            shadow-sm
                            whitespace-nowrap
                        "
                    >
                        Login / Sign Up
                    </a>


                    {/* User */}
                    <button
                        type="button"
                        aria-label="User profile"
                        className="
                            w-10 h-10
                            rounded-full
                            bg-[#006b2c]
                            text-white
                            flex items-center justify-center
                            hover:bg-[#00873a]
                            transition-colors
                        "
                    >
                        <User className="w-5 h-5" />
                    </button>

                </div>

            </div>
        </header>
    );
}

export default Navbar;