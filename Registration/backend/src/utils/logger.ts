export function logInfo(message: string, meta?: any): void {
  console.log(`[INFO] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : '');
}

export function logError(message: string, error?: any): void {
  console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error ? (error.stack || error.message || error) : '');
}
