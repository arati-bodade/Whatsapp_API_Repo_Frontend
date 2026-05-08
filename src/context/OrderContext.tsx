"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Order {
    id: string
    planName: string
    price: string
    credits: string
    date: string
    status: 'Paid' | 'Pending' | 'Failed'
    validity: string
}

interface OrderContextType {
    orders: Order[]
    addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([])

    const addOrder = (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
        const newOrder: Order = {
            ...orderData,
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'Paid',
        }
        setOrders((prev) => [newOrder, ...prev])
    }

    return (
        <OrderContext.Provider value={{ orders, addOrder }}>
            {children}
        </OrderContext.Provider>
    )
}

export function useOrder() {
    const context = useContext(OrderContext)
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider')
    }
    return context
}
