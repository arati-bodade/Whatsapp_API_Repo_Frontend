'use client';
import React from 'react';
import { ResellerAnalytics, DirectBusinessUser } from '@/types/analytics';

interface HierarchyTreeProps {
    resellers: ResellerAnalytics[];
    directUsers: DirectBusinessUser[];
    onSelect: (id: string | null) => void;
    selectedId: string | null;
}

export function HierarchyTree({ resellers, directUsers, onSelect, selectedId }: HierarchyTreeProps) {
    return (
        <div className="p-4 bg-[var(--card-bg,#1A1A1A)] rounded-lg text-white font-sans overflow-x-auto border border-[var(--border-color,#333)]">
            <h3 className="text-xl font-bold mb-6 text-gray-100">Platform Hierarchy</h3>
            
            <div className="flex flex-col items-start min-w-[800px]">
                {/* ROOT NODE: Master Admin */}
                <div className="flex flex-col items-center ml-8 relative">
                    <div 
                        className={`px-6 py-3 rounded-lg border-2 shadow-lg mb-2 text-center cursor-pointer transition-all duration-300 ${
                            selectedId === 'admin' 
                            ? 'bg-purple-900/50 border-purple-500 scale-105' 
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        }`}
                        onClick={() => onSelect('admin')}
                    >
                        <strong className="block text-lg">Master Admin</strong>
                    </div>

                    {/* CONNECTOR LINE DOWN FROM ADMIN */}
                    { (resellers.length > 0 || directUsers.length > 0) && (
                        <div className="w-px h-6 bg-gray-500"></div>
                    )}
                </div>

                {/* CHILDREN CONTAINER */}
                <div className="flex space-x-12 pt-2 border-t-2 border-gray-500 ml-20 relative px-4 pb-4">
                    
                    {/* RESELLERS */}
                    {resellers.map((r) => (
                        <div key={r.id} className="flex flex-col items-center relative min-w-[160px]">
                            {/* Line up to top border */}
                            <div className="w-px h-8 bg-gray-500 absolute -top-10"></div>
                            
                            <div 
                                className={`px-4 py-2 rounded-lg border-2 z-10 text-center text-sm cursor-pointer transition-all duration-300 w-40 shadow-sm ${
                                    selectedId === r.id 
                                    ? 'bg-blue-900/50 border-blue-400 scale-105' 
                                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                }`}
                                onClick={() => onSelect(r.id)}
                            >
                                <strong className="block truncate">{r.name}</strong>
                                <span className="text-xs text-gray-400 flex justify-between mt-1">
                                    <span>Plan:</span> <span className="font-semibold text-gray-300">{r.plan}</span>
                                </span>
                                <span className="text-xs text-gray-400 flex justify-between">
                                    <span>Subs:</span> <span className="font-semibold text-blue-300">{r.businesses}</span>
                                </span>
                            </div>

                            {/* SUB-BUSINESSES */}
                            {r.subUsers && r.subUsers.length > 0 && (
                                <div className="flex flex-col items-center mt-2 w-full px-2">
                                    <div className="w-px h-6 bg-gray-500"></div>
                                    <div className="border-t-2 border-gray-500 w-full relative">
                                        <div className="flex justify-around pt-4 gap-2">
                                            {r.subUsers.map(sub => (
                                                <div key={sub.id} className="flex flex-col items-center relative">
                                                    <div className="w-px h-4 bg-gray-500 absolute -top-4"></div>
                                                    <div className={`px-2 py-1.5 rounded border border-gray-600 z-10 text-center text-[10px] cursor-pointer w-20 truncate transition-all duration-300 ${
                                                        selectedId === sub.id 
                                                        ? 'bg-green-900/50 border-green-500 scale-110 shadow-md ring-1 ring-green-500' 
                                                        : 'bg-gray-800/80 hover:bg-gray-700 hover:border-gray-500'
                                                    }`}
                                                    onClick={() => onSelect(sub.id)}
                                                    title={sub.name}>
                                                        <span className="block font-medium truncate">{sub.name}</span>
                                                        <span className="text-gray-400 scale-90 inline-block truncate w-full">{sub.plan}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* DIRECT BUSINESS USERS */}
                    {directUsers.length > 0 && (
                        <div className="flex flex-col items-center relative shrink-0 min-w-[180px]">
                            <div className="w-px h-8 bg-gray-500 absolute -top-10"></div>
                            <div className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-500 bg-gray-900/50 text-center text-sm w-44 mb-4">
                                <strong className="text-gray-300 font-medium">Direct Businesses</strong>
                            </div>
                            
                            <div className="flex flex-col gap-3 relative">
                                {/* Vertical connecting line for direct users list */}
                                <div className="w-px bg-gray-600 absolute left-1/2 -top-4 bottom-4 -translate-x-1/2 -z-10"></div>
                                
                                {directUsers.map(du => (
                                    <div 
                                        key={du.id} 
                                        className={`px-4 py-2 rounded-lg border border-gray-600 z-10 text-center text-sm cursor-pointer transition-all duration-300 w-44 shadow-sm ${
                                            selectedId === du.id 
                                            ? 'bg-orange-900/50 border-orange-400 scale-105' 
                                            : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                        onClick={() => onSelect(du.id)}
                                        title={du.name}
                                    >
                                        <strong className="block truncate font-medium">{du.name}</strong>
                                        <span className="text-xs text-gray-400 mt-1 block truncate">{du.plan}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
