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

export function toErrorResponse(err: unknown) {
  if (err instanceof RouteError) {
    return NextResponse.json(failure(err.message, err.details, err.code), { status: err.status });
  }

  // Log l'erreur pour debug
  console.error("Unhandled error:", err);
  
  return NextResponse.json(failure("Erreur serveur", undefined, "INTERNAL"), { status: 500 });
}
