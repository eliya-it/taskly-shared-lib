export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 100
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = baseDelay * 2 ** attempt + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed after retries"); // Should not reach here
}
