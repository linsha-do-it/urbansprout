const Discount = require('../models/Discount');
const Product = require('../models/Product');
const mongoose = require('mongoose');

class DiscountLifecycleService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start the automatic discount lifecycle management
  start() {
    if (this.isRunning) {
      console.log('Discount lifecycle service is already running');
      return;
    }

    console.log('Starting discount lifecycle service...');
    this.isRunning = true;

    // Run immediately on start
    this.processDiscounts();

    // Run every 5 minutes
    this.intervalId = setInterval(() => {
      this.processDiscounts();
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Stop the service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Discount lifecycle service stopped');
  }

  // Process all discounts for lifecycle management
  async processDiscounts() {
    try {
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️  Database not connected. Skipping discount lifecycle processing.');
        return;
      }
      
      console.log('Processing discount lifecycle...');
      const now = new Date();

      // Find discounts that need to be applied (start time reached)
      const discountsToApply = await Discount.find({
        active: true,
        autoApplied: false,
        startDate: { $lte: now },
        endDate: { $gt: now }
      });

      // Find discounts that need to be removed (end time reached)
      const discountsToRemove = await Discount.find({
        active: true,
        autoRemoved: false,
        endDate: { $lte: now }
      });

      let totalApplied = 0;
      let totalRemoved = 0;

      // Apply discounts
      for (const discount of discountsToApply) {
        try {
          const result = await discount.autoApplyToProducts();
          totalApplied += result.applied;
          console.log(`Applied discount "${discount.name}" to ${result.applied} products`);
        } catch (error) {
          console.error(`Error applying discount ${discount._id}:`, error);
        }
      }

      // Remove discounts
      for (const discount of discountsToRemove) {
        try {
          const result = await discount.autoRemoveFromProducts();
          totalRemoved += result.removed;
          console.log(`Removed discount "${discount.name}" from ${result.removed} products`);
        } catch (error) {
          console.error(`Error removing discount ${discount._id}:`, error);
        }
      }

      if (totalApplied > 0 || totalRemoved > 0) {
        console.log(`Discount lifecycle processed: ${totalApplied} applied, ${totalRemoved} removed`);
      }

    } catch (error) {
      console.error('Error in discount lifecycle processing:', error);
    }
  }

  // Manually trigger discount processing
  async triggerProcessing() {
    await this.processDiscounts();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastProcessed: this.lastProcessed
    };
  }
}

// Create singleton instance
const discountLifecycleService = new DiscountLifecycleService();

module.exports = discountLifecycleService;











