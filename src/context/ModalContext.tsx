"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
    title: string;
    message: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
}

interface ModalContextType {
    isOpen: boolean;
    type: ModalType;
    options: ModalOptions;
    showAlert: (title: string, message: string, onConfirm?: () => void) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
    showPrompt: (title: string, message: string, onConfirm: (value: string) => void, onCancel?: () => void, defaultValue?: string) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<ModalType>('alert');
    const [options, setOptions] = useState<ModalOptions>({ title: '', message: '' });

    const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
        setOptions({ title, message, onConfirm });
        setType('alert');
        setIsOpen(true);
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        setOptions({ title, message, onConfirm, onCancel });
        setType('confirm');
        setIsOpen(true);
    }, []);

    const showPrompt = useCallback((title: string, message: string, onConfirm: (value: string) => void, onCancel?: () => void, defaultValue?: string) => {
        setOptions({ title, message, onConfirm: (val) => onConfirm(val || ''), onCancel, defaultValue });
        setType('prompt');
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ModalContext.Provider value={{ isOpen, type, options, showAlert, showConfirm, showPrompt, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
