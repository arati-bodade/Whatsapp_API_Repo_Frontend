"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus, User, Mail, Phone, Lock, Building2, FileText, CreditCard, MapPin, Hash, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import resellerService, { ResellerRegisterData } from "@/services/resellerService"
import CountrySearchDropdown from "@/components/ui/country-search-dropdown"

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showDuplicateEmailModal, setShowDuplicateEmailModal] = useState(false)
    
    // Validation state
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

    // Form State
    const [formData, setFormData] = useState<ResellerRegisterData>({
        profile: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
        },
        business: {
            business_name: "",
            business_description: "",
            erp_system: "",
            gstin: "",
        },
        address: {
            full_address: "",
            pincode: "",
            country: "",
        },
        bank: {
            bank_name: "",
        }
    })

    const [confirmPassword, setConfirmPassword] = useState("")
    const [username, setUsername] = useState("")
    
    // Validation functions
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
    
    const validatePhone = (phone: string) => {
        const phoneRegex = /^[6-9]\d{9}$/
        return phoneRegex.test(phone.replace(/\s/g, ''))
    }
    
    const validatePassword = (password: string) => {
        if (password.length < 8) return "Password must be at least 8 characters"
        if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
        if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
        if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
        if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain at least one special character"
        return ""
    }
    
    const validateGSTIN = (gstin: string) => {
        if (!gstin) return "" // Optional field
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        return gstinRegex.test(gstin) ? "" : "Invalid GSTIN format"
    }
    
    const validatePincode = (pincode: string) => {
        if (!pincode) return "" // Optional field
        const pincodeRegex = /^[1-9][0-9]{5}$/
        return pincodeRegex.test(pincode) ? "" : "Invalid pincode format"
    }
    
    const validateField = (fieldName: string, value: string) => {
        const errors: Record<string, string> = {}
        
        switch (fieldName) {
            case 'name':
                if (!value.trim()) errors.name = "Full name is required"
                else if (value.trim().length < 3) errors.name = "Name must be at least 3 characters"
                break
            case 'username':
                if (!value.trim()) errors.username = "Username is required"
                else if (value.length < 3) errors.username = "Username must be at least 3 characters"
                else if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.username = "Username can only contain letters, numbers, and underscores"
                break
            case 'email':
                if (!value.trim()) errors.email = "Email is required"
                else if (!validateEmail(value)) errors.email = "Invalid email format"
                break
            case 'phone':
                if (!value.trim()) errors.phone = "Phone number is required"
                else if (!validatePhone(value)) errors.phone = "Invalid Indian mobile number (10 digits starting with 6-9)"
                break
            case 'password':
                const passwordError = validatePassword(value)
                if (passwordError) errors.password = passwordError
                break
            case 'business_name':
                if (!value.trim()) errors.business_name = "Business name is required"
                break
            case 'gstin':
                const gstinError = validateGSTIN(value)
                if (gstinError) errors.gstin = gstinError
                break
            case 'pincode':
                const pincodeError = validatePincode(value)
                if (pincodeError) errors.pincode = pincodeError
                break
            case 'confirmPassword':
                if (!value) errors.confirmPassword = "Please confirm your password"
                else if (value !== formData.profile.password) errors.confirmPassword = "Passwords do not match"
                break
        }
        
        return errors
    }
    
    const handleFieldBlur = (fieldName: string, value: string) => {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
        const errors = validateField(fieldName, value)
        setFieldErrors(prev => ({ ...prev, ...errors }))
    }
    
    const validateForm = () => {
        const allErrors: Record<string, string> = {}
        
        // Extract all values safely
        const name = formData.profile.name ?? ''
        const email = formData.profile.email ?? ''
        const phone = formData.profile.phone ?? ''
        const password = formData.profile.password ?? ''
        const businessName = formData.business?.business_name ?? ''
        const gstin = formData.business?.gstin ?? ''
        const pincode = formData.address?.pincode ?? ''
        
        // Validate all required fields
        allErrors['name'] = validateField('name', name).name || ''
        allErrors['username'] = validateField('username', username).username || ''
        allErrors['email'] = validateField('email', email).email || ''
        allErrors['phone'] = validateField('phone', phone).phone || ''
        allErrors['password'] = validateField('password', password).password || ''
        allErrors['business_name'] = validateField('business_name', businessName).business_name || ''
        allErrors['confirmPassword'] = validateField('confirmPassword', confirmPassword).confirmPassword || ''
        
        // Validate optional fields if they have values
        const gstinError = validateField('gstin', gstin).gstin
        if (gstinError) allErrors['gstin'] = gstinError
        
        const pincodeError = validateField('pincode', pincode).pincode
        if (pincodeError) allErrors['pincode'] = pincodeError
        
        setFieldErrors(allErrors)
        setTouchedFields(Object.keys(allErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
        
        return Object.values(allErrors).every(error => !error)
    }

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            profile: { ...formData.profile, [name]: value }
        })
        
        // Real-time validation for touched fields
        if (touchedFields[name]) {
            const errors = validateField(name, value)
            setFieldErrors(prev => ({ ...prev, ...errors }))
        }
    }

    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            business: { ...formData.business, [name]: value }
        })
        
        // Real-time validation for touched fields
        if (touchedFields[name]) {
            const errors = validateField(name, value)
            setFieldErrors(prev => ({ ...prev, ...errors }))
        }
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            address: { ...formData.address, [name]: value }
        })
        
        // Real-time validation for touched fields
        if (touchedFields[name]) {
            const errors = validateField(name, value)
            setFieldErrors(prev => ({ ...prev, ...errors }))
        }
    }

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            bank: { ...formData.bank, [name]: value }
        })
    }
    
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setUsername(value)
        
        // Real-time validation for touched fields
        if (touchedFields.username) {
            const errors = validateField('username', value)
            setFieldErrors(prev => ({ ...prev, ...errors }))
        }
    }
    
    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setConfirmPassword(value)
        
        // Real-time validation for touched fields
        if (touchedFields.confirmPassword) {
            const errors = validateField('confirmPassword', value)
            setFieldErrors(prev => ({ ...prev, ...errors }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        
        // Validate all fields
        if (!validateForm()) {
            setError("Please fix the validation errors before submitting")
            return
        }
        
        setIsLoading(true)

        try {
            const submissionData = {
                ...formData,
                profile: {
                    ...formData.profile,
                    username: username || formData.profile.email.split('@')[0]
                }
            }

            await resellerService.register(submissionData)
            router.push("/login?registered=true&type=reseller")
        } catch (err: any) {
            console.error("Registration error:", err)
            const errorDetail = err.response?.data?.detail
            if (err.response?.status === 409 || errorDetail === "EMAIL_ALREADY_EXISTS") {
                setShowDuplicateEmailModal(true)
            } else {
                setError(errorDetail || "Registration failed. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[1200px] my-4 relative z-10 px-4">
            {/* Duplicate Email Modal */}
            {showDuplicateEmailModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="duplicate-email-title"
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                    >
                        <div className="p-8 text-center space-y-5 relative">
                            {/* Decorative background circle */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
                            
                            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                                <AlertCircle className="w-10 h-10 animate-pulse" strokeWidth={1.5} />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 id="duplicate-email-title" className="text-2xl font-black text-gray-900 tracking-tight">Email Already Exists</h2>
                                <p className="text-gray-500 text-sm md:text-base leading-relaxed px-4">
                                    The email <span className="font-semibold text-gray-900">{formData.profile.email}</span> is already registered on our platform. Please login to continue.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row bg-gray-50/80 p-5 gap-3 border-t border-gray-100 backdrop-blur-sm">
                            <button
                                onClick={() => setShowDuplicateEmailModal(false)}
                                className="w-full sm:w-1/2 px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all focus:ring-4 focus:ring-gray-100 outline-none"
                            >
                                Use Different Email
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                autoFocus
                                className="w-full sm:w-1/2 px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-[0.98] focus:ring-4 focus:ring-blue-600/30 outline-none flex items-center justify-center gap-2"
                            >
                                Login Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Section - Compact */}
                <div className="text-center mb-6">
                    <div className="flex justify-start mb-2">
                        <Link href="/register-user" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 group border border-blue-100">
                            <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Create User Account
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Reseller Account</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Join us and start managing your business
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* Column 1: Personal Information */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Personal Info
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Full Name *</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            className={`input-field-compact ${fieldErrors.name && touchedFields.name ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={formData.profile.name}
                                            onChange={handleProfileChange}
                                            onBlur={(e) => handleFieldBlur('name', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.name && touchedFields.name && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Username *</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            className={`input-field-compact ${fieldErrors.username && touchedFields.username ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={username}
                                            onChange={handleUsernameChange}
                                            onBlur={(e) => handleFieldBlur('username', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.username && touchedFields.username && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.username}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Email *</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            className={`input-field-compact ${fieldErrors.email && touchedFields.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={formData.profile.email}
                                            onChange={handleProfileChange}
                                            onBlur={(e) => handleFieldBlur('email', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.email && touchedFields.email && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.email}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Phone *</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Mobile Number"
                                            className={`input-field-compact ${fieldErrors.phone && touchedFields.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={formData.profile.phone}
                                            onChange={handleProfileChange}
                                            onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.phone && touchedFields.phone && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Business Information */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                Business Info
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Business Name *</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="business_name"
                                            placeholder="Business Name"
                                            className={`input-field-compact ${fieldErrors.business_name && touchedFields.business_name ? 'border-red-500 focus:border-red-500' : ''}`}
                                            value={formData.business?.business_name}
                                            onChange={handleBusinessChange}
                                            onBlur={(e) => handleFieldBlur('business_name', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.business_name && touchedFields.business_name && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.business_name}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Product/Service</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="business_description"
                                            placeholder="Description"
                                            className="input-field-compact"
                                            value={formData.business?.business_description}
                                            onChange={handleBusinessChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">ERP System</label>
                                    <div className="relative group">
                                        <select
                                            name="erp_system"
                                            className="input-field-compact appearance-none bg-white pl-10"
                                            value={formData.business?.erp_system}
                                            onChange={handleBusinessChange}
                                            style={{ paddingLeft: '0.75rem' }}
                                        >
                                            <option value="">Select ERP</option>
                                            <option value="SAP">SAP</option>
                                            <option value="Oracle">Oracle</option>
                                            <option value="Microsoft Dynamics">Microsoft Dynamics</option>
                                            <option value="Tally">Tally</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">GSTIN</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="gstin"
                                            placeholder="GSTIN"
                                            className={`input-field-compact ${fieldErrors.gstin && touchedFields.gstin ? 'border-red-500 focus:border-red-500' : ''}`}
                                            value={formData.business?.gstin}
                                            onChange={handleBusinessChange}
                                            onBlur={(e) => handleFieldBlur('gstin', e.target.value)}
                                        />
                                    </div>
                                    {fieldErrors.gstin && touchedFields.gstin && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.gstin}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Bank Name</label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="bank_name"
                                            placeholder="Bank Name"
                                            className="input-field-compact"
                                            value={formData.bank?.bank_name}
                                            onChange={handleBankChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Location & Security */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                Security & Loc
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Full Address</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            name="full_address"
                                            placeholder="Complete Address"
                                            className="input-field-compact"
                                            value={formData.address?.full_address}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Country</label>
                                        <CountrySearchDropdown
                                            value={formData.address?.country || ""}
                                            onChange={(value) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, country: value }
                                            })}
                                            placeholder="Search country..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Pin Code</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            placeholder="Pin"
                                            className={`input-field-compact pl-4! ${fieldErrors.pincode && touchedFields.pincode ? 'border-red-500 focus:border-red-500' : ''}`}
                                            value={formData.address?.pincode}
                                            onChange={handleAddressChange}
                                            onBlur={(e) => handleFieldBlur('pincode', e.target.value)}
                                        />
                                        {fieldErrors.pincode && touchedFields.pincode && (
                                            <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.pincode}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Password *</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Password"
                                            className={`input-field-compact pr-8 ${fieldErrors.password && touchedFields.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={formData.profile.password}
                                            onChange={handleProfileChange}
                                            onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && touchedFields.password && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.password}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 ml-1">Confirm *</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className={`input-field-compact pr-8 ${fieldErrors.confirmPassword && touchedFields.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                            required
                                            value={confirmPassword}
                                            onChange={handleConfirmPasswordChange}
                                            onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirmPassword && touchedFields.confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-gray-100 pt-6">
                        <p className="text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Sign in
                            </Link>
                        </p>

                        <button
                            type="submit"
                            className="w-full md:w-auto px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </div>

                </form>
            </div>

            <style jsx global>{`
                .input-field-compact {
                    width: 100%;
                    padding-left: 2.5rem; 
                    padding-right: 0.75rem;
                    padding-top: 0.6rem;
                    padding-bottom: 0.6rem;
                    background-color: hsl(var(--background));
                    border-width: 1px;
                    border-color: hsl(var(--border));
                    border-radius: 0.5rem; /* rounded-lg */
                    color: hsl(var(--foreground));
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .input-field-compact::placeholder {
                    opacity: 0.4;
                    font-size: 0.8rem;
                }
                .input-field-compact:focus {
                    outline: none;
                    background-color: hsl(var(--card));
                    border-color: rgb(37, 99, 235); /* blue-600 */
                    box-shadow: 0 0 0 1px rgb(37, 99, 235);
                }
                select.input-field-compact {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    background-size: 1rem;
                }
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    )
}
