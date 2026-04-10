export class RateLimiter {
  private tokens: number
  private capacity: number
  private refillRate: number // tokens per ms
  private lastRefill: number

  constructor(tokensPerSecond = 1, capacity = 1) {
    this.capacity = capacity
    this.tokens = capacity
    this.refillRate = tokensPerSecond / 1000
    this.lastRefill = Date.now()
  }

  private refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const add = elapsed * this.refillRate
    if (add > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + add)
      this.lastRefill = now
    }
  }

  tryRemoveToken(): boolean {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    return false
  }
}
