import { NextResponse } from "next/server";
import { failure } from "@/lib/api";

export class RouteError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ============================================
// Error Factory Helpers
// ============================================

export function badRequest(code: string, message: string, details?: unknown): RouteError {
  return new RouteError(400, code, message, details);
}

export function unauthorized(message = "Non authentifié"): RouteError {
  return new RouteError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Accès refusé"): RouteError {
  return new RouteError(403, "FORBIDDEN", message);
}

export function notFound(message = "Ressource introuvable"): RouteError {
  return new RouteError(404, "NOT_FOUND", message);
}

export function conflict(message: string, details?: unknown): RouteError {
  return new RouteError(409, "CONFLICT", message, details);
}

export function tooManyRequests(message = "Trop de requêtes"): RouteError {
  return new RouteError(429, "TOO_MANY_REQUESTS", message);
}

export function serverError(message = "Erreur serveur"): RouteError {
  return new RouteError(500, "INTERNAL", message);
}

export function serviceUnavailable(message = "Service temporairement indisponible"): RouteError {
  return new RouteError(503, "SERVICE_UNAVAILABLE", message);
}

// ============================================
// Response Converter
// ============================================

export function toErrorResponse(err: unknown) {
  if (err instanceof RouteError) {
    return NextResponse.json(failure(err.message, err.details, err.code), { status: err.status });
  }

  // Log l'erreur pour debug
  console.error("Unhandled error:", err);
  
  return NextResponse.json(failure("Erreur serveur", undefined, "INTERNAL"), { status: 500 });
}
