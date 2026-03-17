const Product = require('../models/Product');

/**
 * k-Nearest Neighbors (kNN) recommendation algorithm for products
 * Uses cosine similarity based on product features
 */

/**
 * Normalize a value between 0 and 1
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Convert product to feature vector
 */
function productToVector(product) {
  return {
    // Normalized price (0-1)
    price: product.currentPrice || product.regularPrice || 0,
    
    // Category (one-hot encoded later)
    category: product.category || '',
    
    // Tags (boolean features)
    tags: product.tags || [],
    
    // Stock level (0-1)
    stockLevel: product.stock || 0,
    
    // Popularity metrics
    salesCount: product.salesCount || 0,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    
    // Meta features
    featured: product.featured ? 1 : 0,
    
    // Weight and dimensions (optional)
    weight: product.weight || 0,
    hasDimensions: (product.dimensions && Object.keys(product.dimensions).length > 0) ? 1 : 0
  };
}

/**
 * Calculate cosine similarity between two products
 */
function cosineSimilarity(product1, product2, priceRange, stockRange, salesRange) {
  const vec1 = productToVector(product1);
  const vec2 = productToVector(product2);
  
  // Category similarity (exact match = 1, else 0)
  const categoryMatch = vec1.category === vec2.category ? 1 : 0;
  
  // Price similarity (inverse normalized distance)
  const priceSim = 1 - Math.abs(
    normalize(vec1.price, priceRange.min, priceRange.max) - 
    normalize(vec2.price, priceRange.min, priceRange.max)
  );
  
  // Tags similarity (Jaccard similarity)
  const tags1 = new Set(vec1.tags);
  const tags2 = new Set(vec2.tags);
  const intersection = new Set([...tags1].filter(x => tags2.has(x)));
  const union = new Set([...tags1, ...tags2]);
  const tagsSim = union.size > 0 ? intersection.size / union.size : 0;
  
  // Stock level similarity
  const stockSim = 1 - Math.abs(
    normalize(vec1.stockLevel, stockRange.min, stockRange.max) - 
    normalize(vec2.stockLevel, stockRange.min, stockRange.max)
  );
  
  // Rating similarity
  const ratingSim = 1 - Math.abs(vec1.rating - vec2.rating) / 5; // Max rating is 5
  
  // Reviews count similarity (normalized)
  const reviewsSim = 1 - Math.abs(
    normalize(vec1.reviews, 0, salesRange.max) - 
    normalize(vec2.reviews, 0, salesRange.max)
  );
  
  // Sales similarity
  const salesSim = 1 - Math.abs(
    normalize(vec1.salesCount, salesRange.min, salesRange.max) - 
    normalize(vec2.salesCount, salesRange.min, salesRange.max)
  );
  
  // Feature similarity
  const featuresSim = (vec1.featured === vec2.featured) ? 1 : 0;
  
  // Weight similarity (if both have weight)
  const weightSim = (vec1.weight > 0 && vec2.weight > 0) 
    ? 1 - Math.min(Math.abs(vec1.weight - vec2.weight) / Math.max(vec1.weight, vec2.weight), 1)
    : 0;
  
  // Dimensions similarity
  const dimsSim = (vec1.hasDimensions === vec2.hasDimensions) ? 1 : 0;
  
  // Calculate weighted cosine similarity
  const weights = {
    category: 0.3,
    price: 0.15,
    tags: 0.15,
    stockLevel: 0.05,
    rating: 0.1,
    reviews: 0.05,
    sales: 0.1,
    features: 0.05,
    weight: 0.03,
    dimensions: 0.02
  };
  
  const similarity = 
    weights.category * categoryMatch +
    weights.price * priceSim +
    weights.tags * tagsSim +
    weights.stockLevel * stockSim +
    weights.rating * ratingSim +
    weights.reviews * reviewsSim +
    weights.sales * salesSim +
    weights.features * featuresSim +
    weights.weight * weightSim +
    weights.dimensions * dimsSim;
  
  return similarity;
}

/**
 * Get recommendations using kNN algorithm
 * @param {string} productId - The ID of the product to get recommendations for
 * @param {number} k - Number of recommendations (default: 6)
 * @returns {Array} Array of recommended products
 */
async function getKNNRecommendations(productId, k = 6) {
  try {
    // Get the target product
    const targetProduct = await Product.findById(productId);
    
    if (!targetProduct) {
      console.log('Target product not found');
      return [];
    }
    
    // Get all other published, non-archived products
    const allProducts = await Product.find({
      _id: { $ne: productId },
      published: true,
      archived: false
    }).lean();
    
    if (allProducts.length === 0) {
      console.log('No other products found');
      return [];
    }
    
    // Calculate ranges for normalization
    const prices = allProducts.map(p => p.currentPrice || p.regularPrice || 0);
    const stocks = allProducts.map(p => p.stock || 0);
    const sales = allProducts.map(p => p.salesCount || 0);
    
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
    
    const stockRange = {
      min: Math.min(...stocks),
      max: Math.max(...stocks)
    };
    
    const salesRange = {
      min: Math.min(...sales),
      max: Math.max(...sales)
    };
    
    // Calculate similarity for each product
    const similarities = allProducts.map(product => ({
      product,
      similarity: cosineSimilarity(targetProduct, product, priceRange, stockRange, salesRange)
    }));
    
    // Sort by similarity (descending) and take top k
    const recommendations = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map(item => item.product);
    
    console.log(`KNN: Found ${recommendations.length} recommendations for product ${productId}`);
    
    return recommendations;
    
  } catch (error) {
    console.error('Error in KNN recommendations:', error);
    // Fallback to category-based recommendations
    return getFallbackRecommendations(productId);
  }
}

/**
 * Fallback recommendation method (simple category-based)
 */
async function getFallbackRecommendations(productId) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      return [];
    }
    
    const recommendations = await Product.find({
      category: product.category,
      _id: { $ne: productId },
      published: true,
      archived: false
    })
    .sort({ salesCount: -1, rating: -1 })
    .limit(6)
    .lean();
    
    return recommendations;
  } catch (error) {
    console.error('Error in fallback recommendations:', error);
    return [];
  }
}

/**
 * Hybrid approach: Combine kNN with category-based recommendations
 */
async function getHybridRecommendations(productId, k = 6) {
  try {
    // Get kNN recommendations
    const knnRecs = await getKNNRecommendations(productId, k);
    
    // Get fallback recommendations
    const fallbackRecs = await getFallbackRecommendations(productId);
    
    // Combine and deduplicate
    const seenIds = new Set(knnRecs.map(p => p._id.toString()));
    const combined = [...knnRecs];
    
    for (const product of fallbackRecs) {
      if (!seenIds.has(product._id.toString()) && combined.length < k * 2) {
        combined.push(product);
        seenIds.add(product._id.toString());
      }
    }
    
    // Sort by combined score (prefer kNN results, then by sales/rating)
    combined.sort((a, b) => {
      const aScore = (a.salesCount || 0) * 0.7 + (a.rating || 0) * 0.3;
      const bScore = (b.salesCount || 0) * 0.7 + (b.rating || 0) * 0.3;
      return bScore - aScore;
    });
    
    return combined.slice(0, k);
  } catch (error) {
    console.error('Error in hybrid recommendations:', error);
    return getFallbackRecommendations(productId);
  }
}

module.exports = {
  getKNNRecommendations,
  getFallbackRecommendations,
  getHybridRecommendations
};











