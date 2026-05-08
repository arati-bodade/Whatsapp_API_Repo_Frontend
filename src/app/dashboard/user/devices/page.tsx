"use client";

import dynamic from "next/dynamic";

const DeviceList = dynamic(
    () => import("@/components/DeviceList"),
    { ssr: false }
);

import { useEffect, useState } from "react";

export default function UserDevicesPage() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const storedId = localStorage.getItem("user_id");
        if (storedId) {
            setUserId(storedId);
        }
    }, []);

    if (!userId) {
        return <div className="p-8 text-gray-500">Loading user profile...</div>;
    }

    return <DeviceList userId={userId} />;
}
