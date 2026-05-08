import { Plan } from "@/components/plans/PlansComponents"

export const resellerPlans: Plan[] = [
    {
        name: "STARTER",
        price: "₹5,000",
        credits: "25,000",
        rate: "0.20 paise",
        validity: "365 days",
        colorTheme: "blue"
    },
    {
        name: "BUSINESS",
        price: "₹10,000",
        credits: "100,000",
        rate: "0.10 paise",
        validity: "365 days",
        isPopular: true,
        colorTheme: "purple"
    },
    {
        name: "ENTERPRISE",
        price: "₹50,000",
        credits: "600,000",
        rate: "0.08 paise",
        validity: "365 days",
        colorTheme: "blue"
    }
]

export const userPlans: Plan[] = [
    {
        name: "DEMO",
        price: "₹0",
        credits: "30",
        rate: "0 paise",
        validity: "3 days",
        colorTheme: "green"
    },
    {
        name: "MAP 9A",
        price: "₹500",
        credits: "1,000",
        rate: "0.5 paise",
        validity: "30 days",
        colorTheme: "green"
    },
    {
        name: "MAP 9B",
        price: "₹2,000",
        credits: "5,000",
        rate: "0.4 paise",
        validity: "180 days",
        colorTheme: "green"
    },
    {
        name: "MAP 9D",
        price: "₹6,000",
        credits: "25,000",
        rate: "0.24 paise",
        validity: "365 days",
        colorTheme: "green"
    },
    {
        name: "MAP 9C",
        price: "₹3,000",
        credits: "10,000",
        rate: "0.3 paise",
        validity: "365 days",
        colorTheme: "green"
    },
    {
        name: "MAP 9E",
        price: "₹11,000",
        credits: "50,000",
        rate: "0.22 paise",
        validity: "365 days",
        colorTheme: "green"
    }
]
