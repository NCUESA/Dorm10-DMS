'use client'

import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientProviders({ children }) {
	return (
		<AuthProvider>
			{children}
		</AuthProvider>
	);
}
