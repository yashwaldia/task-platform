import { Model, Document } from 'mongoose';

export interface PaginationQuery {
  page?:   string | number;
  limit?:  string | number;
  sortBy?: string;
  order?:  'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data:       T[];
  pagination: {
    total:       number;
    page:        number;
    limit:       number;
    totalPages:  number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Reusable pagination helper.
 * filter typed as Record<string, any> — mongoose.FilterQuery resolves
 * to the full Query object in Mongoose 9 and causes type conflicts.
 * Record<string, any> is fully compatible at runtime with Mongoose .find() calls.
 */
export const paginate = async <T extends Document>(
  model:     Model<T>,
  filter:    Record<string, any>,
  query:     PaginationQuery,
  populate?: string | string[]
): Promise<PaginatedResult<T>> => {
  const page    = Math.max(1,   parseInt(String(query.page  ?? '1'),   10));
  const limit   = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '10'), 10)));
  const skip    = (page - 1) * limit;
  const sortBy  = query.sortBy ?? 'createdAt';
  const order   = query.order === 'asc' ? 1 : -1;

  let queryBuilder = model
    .find(filter)
    .sort({ [sortBy]: order } as Record<string, 1 | -1>)
    .skip(skip)
    .limit(limit);

  if (populate) {
    const fields = Array.isArray(populate) ? populate : [populate];
    for (const field of fields) {
      queryBuilder = queryBuilder.populate(field) as typeof queryBuilder;
    }
  }

  const [data, total] = await Promise.all([
    queryBuilder.exec(),
    model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
