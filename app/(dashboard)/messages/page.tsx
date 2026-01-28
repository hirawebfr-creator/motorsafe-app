"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";

/**
 * Messages page - Redirects to support or shows coming soon
 * The messages feature is currently handled via the Support system
 */
export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to support after a brief display
    const timer = setTimeout(() => {
      router.push("/support");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "60vh", 
      padding: "32px",
      textAlign: "center" 
    }}>
      <div style={{ 
        width: "80px", 
        height: "80px", 
        borderRadius: "20px", 
        background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: "24px" 
      }}>
        <MessageSquare size={40} color="#fff" />
      </div>
      
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
        Messages
      </h1>
      
      <p style={{ fontSize: "16px", color: "#6B7280", maxWidth: "400px", margin: "0 0 24px" }}>
        La messagerie est intégrée au système de support. 
        Vous allez être redirigé automatiquement...
      </p>
      
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6366F1" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Redirection vers le support...</span>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
