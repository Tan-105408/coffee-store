/**
 * ponytail: Legacy patcher for Prisma client — only needed if `prisma generate` itself fails
 * on Node 24 (e.g. WASM incompatibility). As of 2026-07, `prisma generate` works after
 * removing indexes on NVarChar(Max) fields. Run `npx prisma generate` first; only use this
 * if that fails.
 *
 * If re-running after fix: also copy matching engine binary from @prisma/engines:
 *   cp node_modules/@prisma/engines/query_engine-windows.dll.node node_modules/.prisma/client/
const fs = require("fs");
const path = require("path");

const CLIENT_DIR = path.join(__dirname, "..", "node_modules", ".prisma", "client");
const INDEX_FILE = path.join(CLIENT_DIR, "index.js");
const SCHEMA_FILE = path.join(CLIENT_DIR, "schema.prisma");

let content = fs.readFileSync(INDEX_FILE, "utf8");

// === 1. Add $Enums exports ===
content = content.replace(
  /exports\.\$Enums = \{\}/,
  `exports.$Enums = {
exports.$Enums.PromotionType = makeStrictEnum({ buyXGetY: 'buyXGetY', percentOff: 'percentOff', freeItem: 'freeItem' });
exports.$Enums.VoucherDiscountType = makeStrictEnum({ percent: 'percent', fixed: 'fixed' });
exports.$Enums.VoucherTriggerType = makeStrictEnum({ totalSpend: 'totalSpend', orderCount: 'orderCount', specificProduct: 'specificProduct' });
exports.$Enums.Role = makeStrictEnum({ user: 'user', admin: 'admin' });
exports.$Enums.OrderStatus = makeStrictEnum({ pending: 'pending', processing: 'processing', completed: 'completed', cancelled: 'cancelled' });
exports.$Enums.PaymentMethod = makeStrictEnum({ cash: 'cash', vnpay: 'vnpay', payos: 'payos' });
exports.$Enums.PaymentStatus = makeStrictEnum({ pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed' });
exports.$Enums.TransactionStatus = makeStrictEnum({ pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed', cancelled: 'cancelled' });`
);

// === 2. Add Product new scalar fields ===
// After isBestSeller in Product ScalarFieldEnum
content = content.replace(
  /isBestSeller: 'isBestSeller',\n  promoTag: 'promoTag',/,
  `isBestSeller: 'isBestSeller',
  bestSellerOverride: 'bestSellerOverride',
  bestSellerReason: 'bestSellerReason',
  promoTag: 'promoTag',`
);

// === 3. Add new ScalarFieldEnums after OrderItemScalarFieldEnum ===
const newScalarEnums = `
exports.Prisma.SiteSettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value'
};

exports.Prisma.PromotionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  buyQuantity: 'buyQuantity',
  getQuantity: 'getQuantity',
  minQuantity: 'minQuantity',
  discount: 'discount',
  freeProductId: 'freeProductId',
  isActive: 'isActive',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt'
};

exports.Prisma.VoucherScalarFieldEnum = {
  id: 'id',
  code: 'code',
  description: 'description',
  discountType: 'discountType',
  discountValue: 'discountValue',
  minOrderValue: 'minOrderValue',
  maxDiscount: 'maxDiscount',
  usageLimit: 'usageLimit',
  usedCount: 'usedCount',
  isActive: 'isActive',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.UserVoucherScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  voucherId: 'voucherId',
  isUsed: 'isUsed',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.VoucherRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  triggerType: 'triggerType',
  threshold: 'threshold',
  voucherId: 'voucherId',
  isActive: 'isActive'
};`;

content = content.replace(
  /exports\.Prisma\.SortOrder/,
  newScalarEnums + "\n\nexports.Prisma.SortOrder"
);

// === 4. Update ModelName ===
content = content.replace(
  /exports\.Prisma\.ModelName = \{[\s\S]*?\};/,
  `exports.Prisma.ModelName = {
  User: 'User',
  Product: 'Product',
  Cart: 'Cart',
  CartItem: 'CartItem',
  RefreshToken: 'RefreshToken',
  Review: 'Review',
  PaymentTransaction: 'PaymentTransaction',
  Order: 'Order',
  OrderItem: 'OrderItem',
  SiteSetting: 'SiteSetting',
  Promotion: 'Promotion',
  Voucher: 'Voucher',
  UserVoucher: 'UserVoucher',
  VoucherRule: 'VoucherRule'
};`
);

// === 5. Patch runtimeDataModel JSON ===
// Parse, add new models, re-serialize
const rdmMatch = content.match(/config\.runtimeDataModel = JSON\.parse\("(.+?)"\)/);
if (!rdmMatch) {
  console.error("Could not find runtimeDataModel in index.js");
  process.exit(1);
}

// The JSON string is escaped — parse the escaping first
const rawJson = rdmMatch[1];
// Unescape: \\\" -> \", \\\\ -> \\, \\n -> \n
const unescaped = rawJson.replace(/\\\\/g, "\\").replace(/\\"/g, '"').replace(/\\n/g, "\n");
const rdm = JSON.parse(unescaped);

// Helper to create a scalar field
function scalar(name, type, opts = {}) {
  return {
    name,
    kind: "scalar",
    isList: false,
    isRequired: opts.required !== false,
    isUnique: opts.unique || false,
    isId: opts.id || false,
    isReadOnly: false,
    hasDefaultValue: opts.default !== undefined,
    type,
    nativeType: opts.nativeType || null,
    default: opts.default !== undefined ? opts.default : undefined,
    isGenerated: false,
    isUpdatedAt: opts.updatedAt || false,
  };
}

// Helper to create an object (relation) field
function relation(name, type, opts = {}) {
  return {
    name,
    kind: "object",
    isList: opts.isList || false,
    isRequired: opts.required !== false,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    hasDefaultValue: false,
    type,
    nativeType: null,
    relationName: opts.relationName,
    relationFromFields: opts.from || [],
    relationToFields: opts.to || [],
    isGenerated: false,
    isUpdatedAt: false,
  };
}

// --- Update Product model: add bestSellerOverride, bestSellerReason ---
const product = rdm.models.Product;
const prodFields = product.fields;
// Insert after isBestSeller
const bsIdx = prodFields.findIndex((f) => f.name === "isBestSeller");
const overrideField = scalar("bestSellerOverride", "Boolean", { required: false });
const reasonField = scalar("bestSellerReason", "String", { required: false, nativeType: ["NVarChar", ["Max"]] });
prodFields.splice(bsIdx + 1, 0, overrideField, reasonField);

// --- Update User model: add userVouchers relation ---
const user = rdm.models.User;
user.fields.push(
  relation("userVouchers", "UserVoucher", {
    isList: true,
    relationName: "UserToUserVoucher",
  })
);

// --- Add new models ---
rdm.models.SiteSetting = {
  dbName: null,
  schema: null,
  fields: [
    scalar("id", "Int", { id: true, default: { name: "autoincrement", args: [] } }),
    scalar("key", "String", { unique: true }),
    scalar("value", "String", { nativeType: ["NVarChar", ["Max"]] }),
  ],
  primaryKey: null,
  uniqueFields: [],
  uniqueIndexes: [],
  isGenerated: false,
};

rdm.models.Promotion = {
  dbName: null,
  schema: null,
  fields: [
    scalar("id", "Int", { id: true, default: { name: "autoincrement", args: [] } }),
    scalar("name", "String"),
    scalar("type", "String"), // PromotionType enum stored as String in DMMF
    scalar("buyQuantity", "Int", { required: false }),
    scalar("getQuantity", "Int", { required: false }),
    scalar("minQuantity", "Int", { required: false }),
    scalar("discount", "Float", { required: false }),
    scalar("freeProductId", "Int", { required: false }),
    scalar("isActive", "Boolean", { default: true }),
    scalar("startDate", "DateTime", { required: false }),
    scalar("endDate", "DateTime", { required: false }),
    scalar("createdAt", "DateTime", { default: { name: "now", args: [] } }),
  ],
  primaryKey: null,
  uniqueFields: [],
  uniqueIndexes: [],
  isGenerated: false,
};

rdm.models.Voucher = {
  dbName: null,
  schema: null,
  fields: [
    scalar("id", "Int", { id: true, default: { name: "autoincrement", args: [] } }),
    scalar("code", "String", { unique: true }),
    scalar("description", "String", { required: false, nativeType: ["NVarChar", ["500"]] }),
    scalar("discountType", "String"), // VoucherDiscountType
    scalar("discountValue", "Float"),
    scalar("minOrderValue", "Float", { required: false }),
    scalar("maxDiscount", "Float", { required: false }),
    scalar("usageLimit", "Int", { required: false }),
    scalar("usedCount", "Int", { default: 0 }),
    scalar("isActive", "Boolean", { default: true }),
    scalar("expiresAt", "DateTime", { required: false }),
    scalar("createdAt", "DateTime", { default: { name: "now", args: [] } }),
    relation("userVouchers", "UserVoucher", {
      isList: true,
      relationName: "VoucherToUserVoucher",
    }),
    relation("voucherRules", "VoucherRule", {
      isList: true,
      relationName: "VoucherToVoucherRule",
    }),
  ],
  primaryKey: null,
  uniqueFields: [],
  uniqueIndexes: [],
  isGenerated: false,
};

rdm.models.UserVoucher = {
  dbName: null,
  schema: null,
  fields: [
    scalar("id", "Int", { id: true, default: { name: "autoincrement", args: [] } }),
    scalar("userId", "Int", { readOnly: true }),
    relation("user", "User", {
      relationName: "UserToUserVoucher",
      from: ["userId"],
      to: ["id"],
    }),
    scalar("voucherId", "Int", { readOnly: true }),
    relation("voucher", "Voucher", {
      relationName: "VoucherToUserVoucher",
      from: ["voucherId"],
      to: ["id"],
    }),
    scalar("isUsed", "Boolean", { default: false }),
    scalar("usedAt", "DateTime", { required: false }),
    scalar("createdAt", "DateTime", { default: { name: "now", args: [] } }),
  ],
  primaryKey: null,
  uniqueFields: ["userId", "voucherId"],
  uniqueIndexes: [{ fields: ["userId", "voucherId"], isUnique: true }],
  isGenerated: false,
};

rdm.models.VoucherRule = {
  dbName: null,
  schema: null,
  fields: [
    scalar("id", "Int", { id: true, default: { name: "autoincrement", args: [] } }),
    scalar("name", "String"),
    scalar("triggerType", "String"), // VoucherTriggerType
    scalar("threshold", "Float"),
    scalar("voucherId", "Int", { readOnly: true }),
    relation("voucher", "Voucher", {
      relationName: "VoucherToVoucherRule",
      from: ["voucherId"],
      to: ["id"],
    }),
    scalar("isActive", "Boolean", { default: true }),
  ],
  primaryKey: null,
  uniqueFields: [],
  uniqueIndexes: [],
  isGenerated: false,
};

// Add enums to DMMF
rdm.enums = {
  Role: { name: "Role", values: { user: "user", admin: "admin" } },
  OrderStatus: {
    name: "OrderStatus",
    values: { pending: "pending", processing: "processing", completed: "completed", cancelled: "cancelled" },
  },
  PromotionType: {
    name: "PromotionType",
    values: { buyXGetY: "buyXGetY", percentOff: "percentOff", freeItem: "freeItem" },
  },
  VoucherDiscountType: {
    name: "VoucherDiscountType",
    values: { percent: "percent", fixed: "fixed" },
  },
  VoucherTriggerType: {
    name: "VoucherTriggerType",
    values: { totalSpend: "totalSpend", orderCount: "orderCount", specificProduct: "specificProduct" },
  },
  PaymentMethod: {
    name: "PaymentMethod",
    values: { cash: "cash", vnpay: "vnpay", payos: "payos" },
  },
  PaymentStatus: {
    name: "PaymentStatus",
    values: { pending: "pending", processing: "processing", completed: "completed", failed: "failed" },
  },
  TransactionStatus: {
    name: "TransactionStatus",
    values: { pending: "pending", processing: "processing", completed: "completed", failed: "failed", cancelled: "cancelled" },
  },
};

// Re-serialize the JSON — escape for embedding in JS string literal
const newRdmJson = JSON.stringify(rdm).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
content = content.replace(
  /config\.runtimeDataModel = JSON\.parse\("[^"]*"\)/,
  `config.runtimeDataModel = JSON.parse("${newRdmJson}")`
);

// === 6. Ensure enableTracing in config object ===
// Engine binary requires this field; stub generation omits it
if (!content.includes('enableTracing')) {
  content = content.replace(
    /"postinstall": false\n\}/,
    `"postinstall": false,\n  "enableTracing": false\n}`
  );
  console.log("   Added: config.enableTracing = false");
}

// === 7. Update inlineSchema hash (not critical, just for completeness) ===
// Skip — hash mismatch won't break runtime

// Write patched file
fs.writeFileSync(INDEX_FILE, content, "utf8");

// === 8. Copy updated schema.prisma to client dir ===
const mainSchema = fs.readFileSync(path.join(__dirname, "..", "prisma", "schema.prisma"), "utf8");
fs.writeFileSync(SCHEMA_FILE, mainSchema, "utf8");

console.log("✅ Prisma client patched successfully!");
console.log("   Added models: SiteSetting, Promotion, Voucher, UserVoucher, VoucherRule");
console.log("   Added fields: Product.bestSellerOverride, Product.bestSellerReason");
console.log("   Added enums: Role, OrderStatus, PromotionType, VoucherDiscountType, VoucherTriggerType, PaymentMethod, PaymentStatus, TransactionStatus");
console.log("   ⚠️  Revert by running: npx prisma generate (on Node 20 LTS)");
