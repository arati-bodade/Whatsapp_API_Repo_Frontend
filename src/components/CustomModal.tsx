"use client";

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';

export default function CustomModal() {
    const { isOpen, type, options, closeModal } = useModal();
    const [inputValue, setInputValue] = useState(options.defaultValue || '');

    useEffect(() => {
        if (isOpen) {
            setInputValue(options.defaultValue || '');
        }
    }, [isOpen, options.defaultValue]);

    const handleConfirm = () => {
        if (type === 'prompt') {
            options.onConfirm?.(inputValue);
        } else {
            options.onConfirm?.();
        }
        closeModal();
    };

    const handleCancel = () => {
        options.onCancel?.();
        closeModal();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            />
                        </Dialog.Overlay>
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <Dialog.Content asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${
                                                    type === 'alert' ? 'bg-blue-50 text-blue-600' :
                                                    type === 'confirm' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                    {type === 'alert' && <CheckCircle className="w-6 h-6" />}
                                                    {type === 'confirm' && <AlertCircle className="w-6 h-6" />}
                                                    {type === 'prompt' && <HelpCircle className="w-6 h-6" />}
                                                </div>
                                                <Dialog.Title className="text-xl font-bold text-foreground leading-tight">
                                                    {options.title}
                                                </Dialog.Title>
                                            </div>
                                            <button 
                                                onClick={handleCancel}
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <Dialog.Description className="text-muted-foreground mb-6 leading-relaxed">
                                            {options.message}
                                        </Dialog.Description>

                                        {type === 'prompt' && (
                                            <div className="mb-6">
                                                <input
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 mt-2">
                                            {(type === 'confirm' || type === 'prompt') && (
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                                                >
                                                    {options.cancelText || 'Cancel'}
                                                </button>
                                            )}
                                            <button
                                                onClick={handleConfirm}
                                                className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                                    type === 'confirm' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                                                    'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                                }`}
                                            >
                                                {options.confirmText || (type === 'confirm' ? 'Confirm' : 'OK')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </AnimatePresence>
    );
}
