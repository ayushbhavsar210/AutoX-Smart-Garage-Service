/**
 * Pagination and Query Optimization Utilities
 * Helps reduce response size and improve API performance
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {number} defaultLimit - Default items per page (default: 20)
 * @returns {Object} { page, limit, skip }
 */
const getPaginationParams = (query, defaultLimit = 20) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || defaultLimit;

  // Prevent excessive limits
  if (limit > 100) limit = 100;
  if (page < 1) page = 1;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build MongoDB projection object to limit returned fields
 * Reduces response size significantly
 * @param {string[]} fields - Array of field names to include
 * @returns {Object} MongoDB projection object
 */
const buildProjection = (fields) => {
  const projection = {};
  if (Array.isArray(fields) && fields.length > 0) {
    fields.forEach(field => {
      projection[field] = 1;
    });
    return projection;
  }
  return null;
};

/**
 * Format paginated response
 * @param {Array} data - Data items
 * @param {number} total - Total count of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Formatted response with pagination metadata
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPaginationParams,
  buildProjection,
  formatPaginatedResponse,
};
